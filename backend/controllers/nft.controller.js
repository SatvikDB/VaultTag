const NFT = require('../models/NFT');
const User = require('../models/User');
const blockchain = require('../services/blockchain');
const ipfs = require('../services/ipfs');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/nft/mint — Admin only
 * Mints a real NFT on Polygon via smart contract + IPFS metadata
 */
exports.mint = async (req, res, next) => {
  try {
    const { productName, serialNumber, category, description, imageUrl, price } = req.body;

    // Check serial number uniqueness
    const existing = await NFT.findOne({ serialNumber });
    if (existing) {
      return error(res, 'Serial number already exists', 409);
    }

    // Step 1: Build and upload metadata to IPFS
    let ipfsResult = { cid: null, uri: null, gatewayUrl: null };
    if (ipfs.isIPFSReady()) {
      const metadata = ipfs.buildMetadata({ productName, description, imageUrl, serialNumber, category, price });
      ipfsResult = await ipfs.uploadMetadata(metadata);
      console.log(`📦 IPFS uploaded: ${ipfsResult.cid}`);
    }

    // Step 2: Mint on blockchain
    let chainResult = { tokenId: null, txHash: null, blockNumber: null };
    if (blockchain.isBlockchainReady()) {
      const adminAddress = blockchain.getAdminAddress();
      const tokenURI = ipfsResult.uri || `vaulttag://${serialNumber}`;
      chainResult = await blockchain.mintNFT(adminAddress, tokenURI, serialNumber);
      console.log(`⛓️  Minted token #${chainResult.tokenId} — tx: ${chainResult.txHash}`);
    }

    // Step 3: Save to MongoDB
    const nft = await NFT.create({
      tokenId: chainResult.tokenId,
      productName,
      serialNumber,
      category,
      description,
      imageUrl,
      price,
      owner: req.user.email,
      ownerWallet: blockchain.getAdminAddress(),
      status: 'active',
      mintedBy: req.user.email,
      txHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
      ipfsUri: ipfsResult.uri,
      ipfsCid: ipfsResult.cid,
      contractAddress: process.env.CONTRACT_ADDRESS,
      transferHistory: [{
        from: 'VaultTag System',
        to: req.user.email,
        txHash: chainResult.txHash,
        at: new Date()
      }]
    });

    return success(res, {
      nft,
      blockchain: {
        tokenId: chainResult.tokenId,
        txHash: chainResult.txHash,
        blockNumber: chainResult.blockNumber,
        explorerUrl: chainResult.txHash
          ? `https://amoy.polygonscan.com/tx/${chainResult.txHash}`
          : null
      },
      ipfs: {
        cid: ipfsResult.cid,
        uri: ipfsResult.uri,
        gatewayUrl: ipfsResult.gatewayUrl
      }
    }, 'NFT minted successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/nft/link-tag — Admin only
 * Binds an NFC tag UID to an NFT (both on-chain and in DB)
 */
exports.linkTag = async (req, res, next) => {
  try {
    const { tokenId, nfcUid } = req.body;

    const nft = await NFT.findOne({ tokenId: Number(tokenId) });
    if (!nft) {
      return error(res, 'NFT not found', 404);
    }

    if (nft.nfcUid) {
      return error(res, 'NFC tag already linked to this NFT', 409);
    }

    // Check if NFC UID is already used
    const existingNfc = await NFT.findOne({ nfcUid });
    if (existingNfc) {
      return error(res, 'This NFC UID is already linked to another NFT', 409);
    }

    // Link on blockchain
    let chainResult = { txHash: null };
    if (blockchain.isBlockchainReady()) {
      chainResult = await blockchain.linkNFCTag(Number(tokenId), nfcUid);
    }

    // Update MongoDB
    nft.nfcUid = nfcUid;
    await nft.save();

    return success(res, {
      nft,
      txHash: chainResult.txHash,
      explorerUrl: chainResult.txHash
        ? `https://amoy.polygonscan.com/tx/${chainResult.txHash}`
        : null
    }, 'NFC tag linked successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/nft/verify — PUBLIC (no auth required)
 * The core verification endpoint
 */
exports.verify = async (req, res, next) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return error(res, 'Token ID is required', 400);
    }

    // Step 1: Check MongoDB first (fast)
    const nft = await NFT.findOne({ tokenId: Number(tokenId) });

    if (!nft) {
      // Also check blockchain directly if available
      if (blockchain.isBlockchainReady()) {
        const chainData = await blockchain.getTokenData(Number(tokenId));
        if (!chainData) {
          return success(res, { status: 'fake' }, 'Product not found');
        }
        // Token exists on chain but not in our DB — unusual
        return success(res, {
          status: 'authentic',
          onChainOnly: true,
          product: 'Unknown (on-chain only)',
          owner: chainData.owner,
          serialNumber: chainData.serialNumber,
          nfcUID: chainData.nfcUID,
          isRedeemed: chainData.isRedeemed
        }, 'Token found on blockchain');
      }
      return success(res, { status: 'fake' }, 'Product not found');
    }

    // Step 2: Cross-reference with blockchain if available
    let chainVerified = false;
    let chainData = null;
    if (blockchain.isBlockchainReady()) {
      try {
        chainData = await blockchain.getTokenData(Number(tokenId));
        chainVerified = !!chainData;
      } catch (e) {
        console.warn('Chain verification failed, using DB data:', e.message);
      }
    }

    // Step 3: Determine verification status
    const isRedeemed = chainData ? chainData.isRedeemed : nft.redeemed;

    if (isRedeemed) {
      return success(res, {
        status: 'already_redeemed',
        product: nft.productName,
        redeemedAt: nft.redeemedAt,
        redeemedBy: nft.redeemedBy ? nft.redeemedBy.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
        tokenId: nft.tokenId,
        serialNumber: nft.serialNumber,
        imageUrl: nft.imageUrl,
        chainVerified
      }, 'Product already redeemed');
    }

    // Mask owner email for privacy
    const maskedOwner = nft.owner ? nft.owner.replace(/(.{2}).*(@.*)/, '$1***$2') : null;

    return success(res, {
      status: 'authentic',
      product: nft.productName,
      owner: maskedOwner,
      serialNumber: nft.serialNumber,
      category: nft.category,
      imageUrl: nft.imageUrl,
      price: nft.price,
      nfcUid: nft.nfcUid,
      tokenId: nft.tokenId,
      ipfsUri: nft.ipfsUri,
      contractAddress: nft.contractAddress,
      txHash: nft.txHash,
      chainVerified,
      explorerUrl: nft.txHash
        ? `https://amoy.polygonscan.com/tx/${nft.txHash}`
        : null
    }, 'Product is authentic');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/nft/my-nfts — Protected
 */
exports.getMyNfts = async (req, res, next) => {
  try {
    const nfts = await NFT.find({ owner: req.user.email })
      .sort({ createdAt: -1 });
    return success(res, { nfts, count: nfts.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/nft/all — Admin only
 */
exports.getAllNfts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { tokenId: isNaN(search) ? undefined : Number(search) }
      ].filter(Boolean);
    }

    const nfts = await NFT.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await NFT.countDocuments(query);

    return success(res, {
      nfts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/nft/:tokenId — Protected
 */
exports.getNftDetail = async (req, res, next) => {
  try {
    const nft = await NFT.findOne({ tokenId: Number(req.params.tokenId) });
    if (!nft) {
      return error(res, 'NFT not found', 404);
    }

    // Allow access if admin or owner
    if (req.user.role !== 'admin' && nft.owner !== req.user.email) {
      return error(res, 'Access denied', 403);
    }

    // Enrich with blockchain data if available
    let chainData = null;
    if (blockchain.isBlockchainReady() && nft.tokenId) {
      try {
        chainData = await blockchain.getTokenData(nft.tokenId);
      } catch (e) {
        console.warn('Chain data fetch failed:', e.message);
      }
    }

    return success(res, { nft, chainData });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/nft/redeem — Protected
 */
exports.redeem = async (req, res, next) => {
  try {
    const { tokenId } = req.body;

    const nft = await NFT.findOne({ tokenId: Number(tokenId) });
    if (!nft) {
      return error(res, 'NFT not found', 404);
    }

    if (nft.owner !== req.user.email) {
      return error(res, 'Only the owner can redeem', 403);
    }

    if (nft.redeemed) {
      return error(res, 'NFT already redeemed', 409);
    }

    // Redeem on blockchain
    let chainResult = { txHash: null };
    if (blockchain.isBlockchainReady()) {
      chainResult = await blockchain.redeemToken(nft.tokenId);
    }

    // Update MongoDB
    nft.redeemed = true;
    nft.redeemedAt = new Date();
    nft.redeemedBy = req.user.email;
    nft.status = 'redeemed';
    await nft.save();

    return success(res, {
      nft,
      txHash: chainResult.txHash,
      explorerUrl: chainResult.txHash
        ? `https://amoy.polygonscan.com/tx/${chainResult.txHash}`
        : null
    }, 'NFT redeemed successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/nft/transfer — Protected
 */
exports.transfer = async (req, res, next) => {
  try {
    const { tokenId, toEmail } = req.body;

    const nft = await NFT.findOne({ tokenId: Number(tokenId) });
    if (!nft) {
      return error(res, 'NFT not found', 404);
    }

    if (nft.owner !== req.user.email && req.user.role !== 'admin') {
      return error(res, 'Only the owner can transfer', 403);
    }

    if (nft.redeemed) {
      return error(res, 'Cannot transfer a redeemed NFT', 400);
    }

    // Find recipient
    const recipient = await User.findOne({ email: toEmail.toLowerCase() });
    if (!recipient) {
      return error(res, 'Recipient not found', 404);
    }

    // Transfer on blockchain if possible
    let chainResult = { txHash: null };
    if (blockchain.isBlockchainReady() && nft.ownerWallet && recipient.walletAddress) {
      chainResult = await blockchain.transferToken(nft.ownerWallet, recipient.walletAddress, nft.tokenId);
    }

    // Update MongoDB
    const previousOwner = nft.owner;
    nft.owner = recipient.email;
    nft.ownerWallet = recipient.walletAddress || null;
    nft.transferHistory.push({
      from: previousOwner,
      to: recipient.email,
      txHash: chainResult.txHash,
      at: new Date()
    });
    await nft.save();

    return success(res, {
      nft,
      txHash: chainResult.txHash,
      explorerUrl: chainResult.txHash
        ? `https://amoy.polygonscan.com/tx/${chainResult.txHash}`
        : null
    }, 'NFT transferred successfully');
  } catch (err) {
    next(err);
  }
};
