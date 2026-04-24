const NFT = require('../models/NFT');
const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/admin/stats — Admin only
 */
exports.getStats = async (req, res, next) => {
  try {
    const [totalNfts, activeNFTs, redeemedNFTs, unmintedNFTs, totalUsers, totalBuyers, totalSellers, totalAdmins, totalSuperadmins, totalOrders] = await Promise.all([
      NFT.countDocuments(),
      NFT.countDocuments({ status: 'active' }),
      NFT.countDocuments({ status: 'redeemed' }),
      NFT.countDocuments({ status: 'unminted' }),
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'superadmin' }),
      Order.countDocuments()
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const mintsPerDay = await NFT.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const nftsByCategory = await NFT.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return success(res, {
      totalNfts, activeNFTs, redeemedNFTs, unmintedNFTs,
      totalUsers, totalBuyers, totalSellers, totalAdmins, totalSuperadmins, totalOrders,
      mintsPerDay, nftsByCategory
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users — Admin only
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return success(res, { users, count: users.length });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/nft/:tokenId — Admin only (soft delete)
 */
exports.deleteNft = async (req, res, next) => {
  try {
    const nft = await NFT.findOne({ tokenId: Number(req.params.tokenId) });
    if (!nft) {
      return error(res, 'NFT not found', 404);
    }

    nft.status = 'unminted';
    nft.nfcUid = null;
    await nft.save();

    return success(res, { nft }, 'NFT soft-deleted');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/db-explorer — Admin only
 * Returns live MongoDB collection data for the explorer UI
 */
exports.dbExplorer = async (req, res, next) => {
  try {
    const { collection = 'nfts', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let docs = [], total = 0, schema = [];

    if (collection === 'nfts') {
      total = await NFT.countDocuments();
      docs  = await NFT.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
      schema = ['tokenId','productName','serialNumber','category','price','status','owner','nfcUid','imageUrl','txHash','ipfsUri','createdAt'];
    } else if (collection === 'users') {
      total = await User.countDocuments();
      docs  = await User.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
                .select('-passwordHash').lean();
      schema = ['name','email','role','walletAddress','createdAt'];
    } else if (collection === 'orders') {
      total = await Order.countDocuments();
      docs  = await Order.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
      schema = ['orderId','buyer','buyerName','total','paymentMethod','paymentRef','status','acceptedAt','transferredAt','emailSent','createdAt'];
    }

    // Collection-level stats
    const stats = {
      nfts:   { count: await NFT.countDocuments(),   label: 'NFTs',   icon: '👟' },
      users:  { count: await User.countDocuments(),  label: 'Users',  icon: '👤' },
      orders: { count: await Order.countDocuments(), label: 'Orders', icon: '🛒' }
    };

    // DB connection info
    const dbInfo = {
      host:   mongoose.connection.host,
      name:   mongoose.connection.name,
      state:  ['disconnected','connected','connecting','disconnecting'][mongoose.connection.readyState] || 'unknown',
      models: Object.keys(mongoose.models)
    };

    return success(res, { docs, total, schema, stats, dbInfo, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};
