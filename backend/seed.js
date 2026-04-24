require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const NFT = require('./models/NFT');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vaulttag';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await NFT.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'VaultTag Admin',
      email: 'admin@vaulttag.com',
      passwordHash: 'Admin@123',
      role: 'admin'
    });
    console.log(`👤 Admin created: ${admin.email} / Admin@123`);

    // Create buyer user
    const buyer = await User.create({
      name: 'Test Buyer',
      email: 'buyer@vaulttag.com',
      passwordHash: 'Buyer@123',
      role: 'buyer'
    });
    console.log(`👤 Buyer created: ${buyer.email} / Buyer@123`);

    // Create sample NFTs (without blockchain data — those will be set when actually minted)
    const sampleNFTs = [
      {
        tokenId: 1,
        productName: 'Air Jordan 1 Retro High OG',
        serialNumber: 'AJ1-OG-001',
        category: 'Footwear',
        description: 'The Air Jordan 1 Retro High OG "Chicago" is a legendary sneaker that started it all. Features a white, black, and varsity red colorway with premium leather construction.',
        imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
        price: 1,
        owner: admin.email,
        status: 'active',
        mintedBy: admin.email,
        transferHistory: [{ from: 'VaultTag System', to: admin.email, at: new Date() }]
      },
      {
        tokenId: 2,
        productName: 'Nike Dunk Low Panda',
        serialNumber: 'NDL-PND-002',
        category: 'Footwear',
        description: 'The Nike Dunk Low "Panda" features a classic black and white colorway. Premium leather upper with padded collar for comfort and durability.',
        imageUrl: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
        price: 2,
        owner: admin.email,
        status: 'active',
        mintedBy: admin.email,
        transferHistory: [{ from: 'VaultTag System', to: admin.email, at: new Date() }]
      },
      {
        tokenId: 3,
        productName: 'Yeezy Boost 350 V2 Zebra',
        serialNumber: 'YZY-ZBR-003',
        category: 'Footwear',
        description: 'The adidas Yeezy Boost 350 V2 "Zebra" features a white and core black Primeknit upper with a red SPLY-350 marking. Full-length Boost cushioning.',
        imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
        price: 3,
        owner: buyer.email,
        status: 'active',
        mintedBy: admin.email,
        transferHistory: [
          { from: 'VaultTag System', to: admin.email, at: new Date(Date.now() - 86400000) },
          { from: admin.email, to: buyer.email, at: new Date() }
        ]
      }
    ];

    await NFT.insertMany(sampleNFTs);
    console.log(`👟 Created ${sampleNFTs.length} sample NFTs`);

    console.log('\n✅ Seed complete!\n');
    console.log('Demo credentials:');
    console.log('  Admin: admin@vaulttag.com / Admin@123');
    console.log('  Buyer: buyer@vaulttag.com / Buyer@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();
