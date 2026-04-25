# 🏷️ VaultTag — NFT Marketplace for Physical Goods

**Where Style Meets Trust**

VaultTag is a blockchain-powered NFT marketplace for physical luxury products. Every product gets a unique digital identity minted as an NFT on the Polygon blockchain — making authenticity verifiable, ownership traceable, and counterfeiting nearly impossible. :contentReference[oaicite:0]{index=0}

---

## 🌐 What It Does

VaultTag bridges the gap between physical products and blockchain technology.

- Sellers list products → NFT is minted  
- Buyers purchase → Ownership transfers on-chain  
- Every scan, transfer, and redemption is recorded permanently  

This creates a **transparent, secure, and tamper-proof commerce system**.

---

## 👥 Role-Based Platform

| Role | Access |
|------|--------|
| 👑 SuperAdmin | Full platform control, fraud detection, analytics, user management |
| 🛡️ Admin | Order management, payment verification, dispute handling |
| 🏪 Seller | Mint NFTs, link NFC tags, manage products |
| 🛍️ Buyer | Browse, purchase, verify authenticity, track ownership |

---

## ✨ Key Features

- 🪙 **NFT Minting** — Each product gets a blockchain-backed identity  
- 📲 **NFC Tag Binding** — Scan physical product to verify authenticity  
- 🔄 **Ownership Transfer** — Fully on-chain NFT transfer  
- 🛡️ **Fraud Detection** — Detect reused or suspicious NFTs  
- 📊 **Revenue Analytics** — Sales insights and tracking  
- 🧾 **Product Verification** — Verify via Token ID  
- 📦 **Order Management** — Complete lifecycle tracking  

---

## 🧱 Tech Stack

### 🔹 Frontend
- HTML, CSS, JavaScript  
- Three.js (animations)  
- Glassmorphism UI  

### 🔹 Backend
- Node.js + Express.js  
- MongoDB Atlas (Mongoose)  
- JWT Authentication  
- bcryptjs (password hashing)  
- Helmet + Rate Limiting (security)  

### 🔹 Blockchain
- Polygon Amoy Testnet  
- Solidity Smart Contracts  
- Ethers.js  
- Hardhat  

### 🔹 Storage & Payments
- IPFS (via Pinata)  
- Razorpay  

---

## ⚙️ How It Works

```text
1. Seller lists product → NFT minted
2. Metadata stored on IPFS
3. Buyer purchases product
4. Ownership transferred on blockchain
5. Buyer verifies via NFC / Token ID
6. Product redeemed → marked as used
