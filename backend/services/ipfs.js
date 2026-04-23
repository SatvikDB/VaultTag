const { PinataSDK } = require('pinata-web3');

let pinata;

/**
 * Initialize Pinata IPFS connection
 */
function initIPFS() {
  if (!process.env.PINATA_JWT) {
    console.warn('⚠️  Pinata JWT not set. IPFS features will be disabled.');
    return false;
  }

  try {
    pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
    });
    console.log('✅ IPFS (Pinata) connected');
    return true;
  } catch (error) {
    console.error('❌ Pinata init error:', error.message);
    return false;
  }
}

/**
 * Check if IPFS is ready
 */
function isIPFSReady() {
  return !!pinata;
}

/**
 * Upload NFT metadata JSON to IPFS
 * @param {Object} metadata - ERC-721 metadata object
 * @returns {Object} { cid, uri, gatewayUrl }
 */
async function uploadMetadata(metadata) {
  if (!isIPFSReady()) {
    throw new Error('IPFS not initialized');
  }

  try {
    const result = await pinata.upload.json(metadata).addMetadata({
      name: `VaultTag-${metadata.name || 'NFT'}`,
      keyValues: {
        platform: 'VaultTag',
        category: metadata.attributes?.find(a => a.trait_type === 'Category')?.value || 'Unknown'
      }
    });

    const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
    return {
      cid: result.IpfsHash,
      uri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://${gateway}/ipfs/${result.IpfsHash}`
    };
  } catch (error) {
    console.error('❌ IPFS upload error:', error.message);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Build ERC-721 metadata JSON for a shoe product
 */
function buildMetadata({ productName, description, imageUrl, serialNumber, category, price }) {
  return {
    name: productName,
    description: description || `${productName} — Authenticated by VaultTag`,
    image: imageUrl || '',
    external_url: 'https://vaulttag.com',
    attributes: [
      { trait_type: 'Category', value: category },
      { trait_type: 'Serial Number', value: serialNumber },
      { trait_type: 'Price (USD)', value: price, display_type: 'number' },
      { trait_type: 'Platform', value: 'VaultTag' },
      { trait_type: 'Authenticated', value: 'true' }
    ]
  };
}

module.exports = {
  initIPFS,
  isIPFSReady,
  uploadMetadata,
  buildMetadata
};
