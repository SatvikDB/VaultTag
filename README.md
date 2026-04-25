
VaultTag 🏷️
Where Style Meets Trust

VaultTag is a blockchain-powered NFT marketplace for physical luxury products. Every product gets a unique digital identity minted as an NFT on the Polygon blockchain — making authenticity verifiable, ownership traceable, and counterfeiting impossible.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🌐 What It Does
VaultTag bridges the gap between physical products and blockchain technology. When a seller lists a product, a blockchain-backed NFT is minted for it. When a buyer purchases it, ownership transfers on-chain. Every scan, every transfer, every redemption is permanently recorded.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
👥 Role-Based Platform
Role	Access
👑 SuperAdmin	Full platform control — manage admins/sellers, fraud detection, revenue analytics, user blocking
🛡️ Admin	Oversee orders, verify payments, manage disputes, revenue tracking
🏪 Seller	Mint NFTs, link NFC tags, manage product listings, fulfill orders
🛍️ Buyer	Browse products, purchase, verify authenticity, view ownership history
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
✨ Key Features
NFT Minting — Each physical product gets a blockchain-verified digital certificate on Polygon Amoy Testnet
NFC Tag Binding — Link a physical NFC chip to a product's NFT for instant scan-to-verify
Ownership Transfer — NFT ownership moves on-chain when a buyer purchases a product
Fraud Detection — SuperAdmin panel flags suspicious/redeemed product attempts
Revenue Analytics — Sales reports, user growth charts, avg order value tracking
Role-Based Dashboards — Separate, purpose-built dashboards for each role
Product Verification — Buyers can verify any product's authenticity via Token ID
Order Management — Full order lifecycle: pending → payment verified → NFT transferred
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🛠️ Tech Stack

Frontend
--------
Vanilla HTML, CSS, JavaScript
Three.js for animated backgrounds
Responsive dark-themed UI with glassmorphism

Backend
-------
Node.js + Express.js
MongoDB Atlas (Mongoose)
JWT Authentication
bcryptjs password hashing
Express Rate Limiting + Helmet security

Blockchain
----------
Polygon Amoy Testnet
Ethers.js
Hardhat (smart contract deployment)
Solidity smart contract (VaultTag.sol)

Storage & Payments
------------------
Pinata / IPFS for NFT metadata
Razorpay payment gateway
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🚀 Getting Started
Prerequisites
Node.js v18+
MongoDB Atlas account
Polygon wallet with Amoy testnet MATIC
Installation
# Clone the repo
git clone https://github.com/SatvikDB/VaultTag.git
cd VaultTag/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, RAZORPAY keys, etc.

# Seed the database with demo users and products
node seed.js

# Start the server
npm run dev
Open http://localhost:3000 — the login page loads automatically.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🔑 Demo Credentials
Role	Email	Password
SuperAdmin	superadmin@vaulttag.com	Super@123
Admin	admin@vaulttag.com	Admin@123
Seller	seller@vaulttag.com	Seller@123
Buyer	buyer@vaulttag.com	Buyer@123
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
📁 Project Structure
VaultTag/
├── backend/
│   ├── controllers/     # Auth, NFT, Admin, Order logic
│   ├── models/          # User, NFT, Order, AdminSettings
│   ├── routes/          # API route definitions
│   ├── middleware/       # Auth, role guards, error handler
│   ├── services/        # Blockchain, IPFS, Email
│   └── server.js        # Express app entry point
├── frontend/
│   ├── css/style.css    # Global design system
│   ├── js/app.js        # Shared utilities, API client, Auth
│   ├── login.html       # Role-based login landing page
│   ├── superadmin-dashboard.html
│   ├── admin-dashboard.html
│   ├── dashboard.html   # Seller dashboard
│   ├── buyer-dashboard.html
│   └── ...              # Collection, product, verify, orders pages
└── contracts/
    ├── contracts/VaultTag.sol   # Solidity NFT contract
    └── scripts/deploy.js        # Hardhat deployment script
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
🔐 Environment Variables

PORT=3000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret

POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
ADMIN_PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address

PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_pinata_gateway

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret.
