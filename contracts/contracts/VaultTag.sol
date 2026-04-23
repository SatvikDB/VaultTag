// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultTag
 * @dev ERC-721 NFT contract for physical product authentication.
 *      Each token represents a physical shoe with:
 *      - IPFS metadata URI
 *      - Serial number
 *      - NFC tag UID binding
 *      - One-time irreversible redemption
 */
contract VaultTag is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mappings for product data
    mapping(uint256 => string) public serialNumbers;
    mapping(uint256 => string) public nfcUIDs;
    mapping(uint256 => bool) public redeemed;
    mapping(uint256 => uint256) public redeemedAt;

    // Reverse lookup: NFC UID → token ID (to prevent duplicate binding)
    mapping(string => uint256) public nfcToToken;
    mapping(string => bool) public nfcUsed;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed owner, string serialNumber, string tokenURI);
    event NFCLinked(uint256 indexed tokenId, string nfcUID);
    event NFTRedeemed(uint256 indexed tokenId, address indexed redeemedBy, uint256 timestamp);
    event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    constructor() ERC721("VaultTag", "VTAG") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @dev Mint a new NFT for a physical product
     * @param to Address to mint the token to
     * @param uri IPFS metadata URI
     * @param serialNumber Physical product serial number
     */
    function mintNFT(
        address to,
        string memory uri,
        string memory serialNumber
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        serialNumbers[tokenId] = serialNumber;

        emit NFTMinted(tokenId, to, serialNumber, uri);
        return tokenId;
    }

    /**
     * @dev Link an NFC tag's hardware UID to a token (one-time, admin only)
     * @param tokenId The token to link
     * @param nfcUID The NFC tag's factory-burned UID
     */
    function linkNFCTag(uint256 tokenId, string memory nfcUID) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(nfcUIDs[tokenId]).length == 0, "NFC tag already linked to this token");
        require(!nfcUsed[nfcUID], "This NFC UID is already linked to another token");

        nfcUIDs[tokenId] = nfcUID;
        nfcToToken[nfcUID] = tokenId;
        nfcUsed[nfcUID] = true;

        emit NFCLinked(tokenId, nfcUID);
    }

    /**
     * @dev Redeem a token — one-time, irreversible
     *      Only the current owner can redeem
     */
    function redeemToken(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can redeem");
        require(!redeemed[tokenId], "Already redeemed");

        redeemed[tokenId] = true;
        redeemedAt[tokenId] = block.timestamp;

        emit NFTRedeemed(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get complete token data for verification
     */
    function getTokenData(uint256 tokenId) public view returns (
        address owner,
        string memory uri,
        string memory serialNumber,
        string memory nfcUID,
        bool isRedeemed,
        uint256 redemptionTime
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (
            ownerOf(tokenId),
            tokenURI(tokenId),
            serialNumbers[tokenId],
            nfcUIDs[tokenId],
            redeemed[tokenId],
            redeemedAt[tokenId]
        );
    }

    /**
     * @dev Override transfer to emit custom event
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        super.transferFrom(from, to, tokenId);
        emit NFTTransferred(tokenId, from, to);
    }

    /**
     * @dev Get the next token ID that will be minted
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Check if a token exists
     */
    function tokenExists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
