const NFT = require('../models/NFT');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/admin/stats — Admin only
 */
exports.getStats = async (req, res, next) => {
  try {
    const [totalNFTs, activeNFTs, redeemedNFTs, unmintedNFTs, totalUsers, totalBuyers] = await Promise.all([
      NFT.countDocuments(),
      NFT.countDocuments({ status: 'active' }),
      NFT.countDocuments({ status: 'redeemed' }),
      NFT.countDocuments({ status: 'unminted' }),
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' })
    ]);

    // Mints per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const mintsPerDay = await NFT.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // NFTs by category
    const nftsByCategory = await NFT.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return success(res, {
      totalNFTs,
      activeNFTs,
      redeemedNFTs,
      unmintedNFTs,
      totalUsers,
      totalBuyers,
      totalAdmins: totalUsers - totalBuyers,
      mintsPerDay,
      nftsByCategory
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
