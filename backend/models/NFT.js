const mongoose = require('mongoose');
const { CATEGORIES, STATUSES } = require('../config/constants');

const transferHistorySchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  txHash: { type: String, default: null },
  at: { type: Date, default: Date.now }
}, { _id: false });

const nftSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    unique: true,
    sparse: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  imageUrl: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  nfcUid: {
    type: String,
    default: null,
    index: true
  },
  owner: {
    type: String,
    default: null
  },
  ownerWallet: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'active'
  },
  redeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  redeemedBy: {
    type: String,
    default: null
  },
  transferHistory: [transferHistorySchema],
  mintedBy: {
    type: String,
    required: true
  },
  // Blockchain data
  txHash: {
    type: String,
    default: null
  },
  blockNumber: {
    type: Number,
    default: null
  },
  ipfsUri: {
    type: String,
    default: null
  },
  ipfsCid: {
    type: String,
    default: null
  },
  contractAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for fast queries
nftSchema.index({ owner: 1, createdAt: -1 });
nftSchema.index({ status: 1 });
nftSchema.index({ category: 1 });

module.exports = mongoose.model('NFT', nftSchema);
