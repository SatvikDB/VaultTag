const Order = require('../models/Order');
const AdminSettings = require('../models/AdminSettings');
const NFT = require('../models/NFT');
const User = require('../models/User');
const { sendOrderConfirmation } = require('../services/email');
const { success, error } = require('../utils/apiResponse');
const { v4: uuidv4 } = require('uuid');

/* ── Buyer: Create Order ── */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, subtotal, fee, total, paymentMethod, paymentRef, shippingAddress } = req.body;
    if (!items || !items.length) return error(res, 'No items in order', 400);

    const order = await Order.create({
      orderId: 'VT-' + uuidv4().slice(0, 8).toUpperCase(),
      buyer: req.user.email,
      buyerName: req.user.name || '',
      items, subtotal, fee, total,
      paymentMethod, paymentRef: paymentRef || '',
      shippingAddress: shippingAddress || '',
      status: 'pending'
    });

    return success(res, { order }, 'Order placed successfully', 201);
  } catch (err) { next(err); }
};

/* ── Buyer: Get my orders ── */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user.email }).sort({ createdAt: -1 });
    return success(res, { orders });
  } catch (err) { next(err); }
};

/* ── Admin: Get all orders ── */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    return success(res, { orders, count: orders.length });
  } catch (err) { next(err); }
};

/* ── Admin: Accept order + transfer NFTs + send email ── */
exports.acceptOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { adminNote } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return error(res, 'Order not found', 404);
    if (order.status !== 'pending') return error(res, 'Order already processed', 400);

    // ── Transfer each NFT in the order to the buyer ──
    const transferResults = [];
    for (const item of order.items) {
      try {
        const nft = await NFT.findOne({ tokenId: Number(item.tokenId) });
        if (!nft) {
          transferResults.push({ tokenId: item.tokenId, success: false, reason: 'NFT not found' });
          continue;
        }
        if (nft.redeemed) {
          transferResults.push({ tokenId: item.tokenId, success: false, reason: 'Already redeemed' });
          continue;
        }

        const previousOwner = nft.owner;
        nft.owner = order.buyer;
        nft.ownerWallet = null; // buyer wallet unknown unless they connect
        nft.transferHistory.push({
          from: previousOwner,
          to: order.buyer,
          txHash: null,
          at: new Date()
        });
        await nft.save();
        transferResults.push({ tokenId: item.tokenId, productName: item.productName, success: true, from: previousOwner, to: order.buyer });
        console.log(`🔄 NFT #${item.tokenId} transferred: ${previousOwner} → ${order.buyer}`);
      } catch (transferErr) {
        transferResults.push({ tokenId: item.tokenId, success: false, reason: transferErr.message });
        console.error(`❌ Transfer failed for NFT #${item.tokenId}:`, transferErr.message);
      }
    }

    // ── Update order status ──
    order.status = 'accepted';
    order.acceptedAt = new Date();
    order.adminNote = adminNote || '';
    order.transferResults = transferResults;
    await order.save();

    // ── Send confirmation email ──
    const emailResult = await sendOrderConfirmation(order, adminNote || '', transferResults);
    if (emailResult.success) {
      order.emailSent = true;
      await order.save();
    }

    const transferred = transferResults.filter(r => r.success).length;
    return success(res, {
      order,
      transferResults,
      transferred,
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl || null
    }, `Order accepted — ${transferred}/${order.items.length} NFT(s) transferred to buyer`);
  } catch (err) { next(err); }
};

/* ── Admin: Reject order ── */
exports.rejectOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { adminNote } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return error(res, 'Order not found', 404);
    order.status = 'rejected';
    order.adminNote = adminNote || '';
    await order.save();
    return success(res, { order }, 'Order rejected');
  } catch (err) { next(err); }
};

/* ── Admin: Get/Save payment settings ── */
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await AdminSettings.findOne({ adminEmail: req.user.email });
    return success(res, { settings: settings || {} });
  } catch (err) { next(err); }
};

exports.saveSettings = async (req, res, next) => {
  try {
    const { upiId, upiQrImage, bankName, accountNumber, ifscCode, accountHolder, metamaskAddress, apiProvider, apiKeyPublic, notificationEmail } = req.body;
    const settings = await AdminSettings.findOneAndUpdate(
      { adminEmail: req.user.email },
      { upiId, upiQrImage, bankName, accountNumber, ifscCode, accountHolder, metamaskAddress, apiProvider, apiKeyPublic, notificationEmail },
      { upsert: true, new: true, runValidators: true }
    );
    return success(res, { settings }, 'Settings saved');
  } catch (err) { next(err); }
};

/* ── Public: Get admin payment info for checkout ── */
exports.getPublicPaymentInfo = async (req, res, next) => {
  try {
    const settings = await AdminSettings.findOne({}, 'upiId upiQrImage metamaskAddress apiProvider apiKeyPublic');
    return success(res, { paymentInfo: settings || {} });
  } catch (err) { next(err); }
};
