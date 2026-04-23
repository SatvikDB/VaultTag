const { ethers } = require('ethers');

// VaultTag contract ABI — only the functions we need
const CONTRACT_ABI = [
  "function mintNFT(address to, string memory uri, string memory serialNumber) public returns (uint256)",
  "function linkNFCTag(uint256 tokenId, string memory nfcUID) public",
  "function redeemToken(uint256 tokenId) public",
  "function getTokenData(uint256 tokenId) public view returns (address owner, string memory uri, string memory serialNumber, string memory nfcUID, bool isRedeemed, uint256 redemptionTime)",
  "function tokenExists(uint256 tokenId) public view returns (bool)",
  "function getNextTokenId() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId) public",
  "function approve(address to, uint256 tokenId) public",
  "event NFTMinted(uint256 indexed tokenId, address indexed owner, string serialNumber, string tokenURI)",
  "event NFCLinked(uint256 indexed tokenId, string nfcUID)",
  "event NFTRedeemed(uint256 indexed tokenId, address indexed redeemedBy, uint256 timestamp)",
  "event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to)"
];

let provider;
let adminWallet;
let contract;

/**
 * Initialize blockchain connection
 */
function initBlockchain() {
  if (!process.env.POLYGON_RPC_URL || !process.env.ADMIN_PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
    console.warn('⚠️  Blockchain env vars not set. Blockchain features will be disabled.');
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, adminWallet);
    console.log(`✅ Blockchain connected — Admin wallet: ${adminWallet.address}`);
    return true;
  } catch (error) {
    console.error('❌ Blockchain init error:', error.message);
    return false;
  }
}

/**
 * Check if blockchain is available
 */
function isBlockchainReady() {
  return !!(provider && adminWallet && contract);
}

/**
 * Mint an NFT on-chain
 * @param {string} toAddress - Recipient wallet address
 * @param {string} ipfsUri - IPFS metadata URI
 * @param {string} serialNumber - Product serial number
 * @returns {Object} { tokenId, txHash, blockNumber }
 */
async function mintNFT(toAddress, ipfsUri, serialNumber) {
  if (!isBlockchainReady()) {
    throw new Error('Blockchain not initialized');
  }

  try {
    const tx = await contract.mintNFT(toAddress, ipfsUri, serialNumber);
    console.log(`⏳ Mint tx sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Mint confirmed in block ${receipt.blockNumber}`);

    // Parse the NFTMinted event to get the token ID
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
        return parsed && parsed.name === 'NFTMinted';
      } catch { return false; }
    });

    let tokenId;
    if (mintEvent) {
      const parsed = contract.interface.parseLog({ topics: mintEvent.topics, data: mintEvent.data });
      tokenId = Number(parsed.args[0]);
    } else {
      // Fallback: read the next token ID and subtract 1
      const nextId = await contract.getNextTokenId();
      tokenId = Number(nextId) - 1;
    }

    return {
      tokenId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Mint error:', error.message);
    throw new Error(`Blockchain mint failed: ${error.reason || error.message}`);
  }
}

/**
 * Link an NFC tag UID to a token on-chain
 */
async function linkNFCTag(tokenId, nfcUID) {
  if (!isBlockchainReady()) throw new Error('Blockchain not initialized');

  try {
    const tx = await contract.linkNFCTag(tokenId, nfcUID);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    throw new Error(`NFC link failed: ${error.reason || error.message}`);
  }
}

/**
 * Get token data from the blockchain (trustless read)
 */
async function getTokenData(tokenId) {
  if (!isBlockchainReady()) throw new Error('Blockchain not initialized');

  try {
    const exists = await contract.tokenExists(tokenId);
    if (!exists) return null;

    const data = await contract.getTokenData(tokenId);
    return {
      owner: data[0],
      tokenURI: data[1],
      serialNumber: data[2],
      nfcUID: data[3],
      isRedeemed: data[4],
      redemptionTime: Number(data[5])
    };
  } catch (error) {
    throw new Error(`Token data read failed: ${error.reason || error.message}`);
  }
}

/**
 * Redeem a token on-chain (called by the backend on behalf of the buyer)
 * Note: For the hackathon, the admin wallet calls redeem. In production,
 * the buyer would sign their own transaction.
 */
async function redeemToken(tokenId) {
  if (!isBlockchainReady()) throw new Error('Blockchain not initialized');

  try {
    const tx = await contract.redeemToken(tokenId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    throw new Error(`Redeem failed: ${error.reason || error.message}`);
  }
}

/**
 * Transfer a token on-chain
 */
async function transferToken(fromAddress, toAddress, tokenId) {
  if (!isBlockchainReady()) throw new Error('Blockchain not initialized');

  try {
    const tx = await contract.transferFrom(fromAddress, toAddress, tokenId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    throw new Error(`Transfer failed: ${error.reason || error.message}`);
  }
}

/**
 * Get admin wallet address
 */
function getAdminAddress() {
  return adminWallet ? adminWallet.address : null;
}

module.exports = {
  initBlockchain,
  isBlockchainReady,
  mintNFT,
  linkNFCTag,
  getTokenData,
  redeemToken,
  transferToken,
  getAdminAddress
};
