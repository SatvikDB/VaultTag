const Order = require('../models/Order');
const AdminSettings = require('../models/AdminSettings');
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

/* ── Admin: Accept order + send email ── */
exports.acceptOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { adminNote } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return error(res, 'Order not found', 404);
    if (order.status !== 'pending') return error(res, 'Order already processed', 400);

    order.status = 'accepted';
    order.acceptedAt = new Date();
    order.adminNote = adminNote || '';
    await order.save();

    // Send confirmation email
    const emailResult = await sendOrderConfirmation(order, adminNote || '');
    if (emailResult.success) {
      order.emailSent = true;
      await order.save();
    }

    return success(res, {
      order,
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl || null
    }, 'Order accepted and confirmation email sent');
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
