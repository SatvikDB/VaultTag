require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const NFT  = require('./models/NFT');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vaulttag';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await NFT.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Users ──
    const admin = await User.create({
      name: 'VaultTag Admin',
      email: 'admin@vaulttag.com',
      passwordHash: 'Admin@123',
      role: 'admin'
    });
    const buyer = await User.create({
      name: 'Test Buyer',
      email: 'buyer@vaulttag.com',
      passwordHash: 'Buyer@123',
      role: 'buyer'
    });
    console.log('👤 Admin:', admin.email, '/ Admin@123');
    console.log('👤 Buyer:', buyer.email, '/ Buyer@123');

    const now  = new Date();
    const day  = 86400000;

    // ── Helper ──
    const nft = (id, name, serial, cat, desc, img, price, owner, minted) => ({
      tokenId: id,
      productName: name,
      serialNumber: serial,
      category: cat,
      description: desc,
      imageUrl: img,
      price,
      owner,
      status: 'active',
      mintedBy: minted,
      transferHistory: [{ from: 'VaultTag System', to: owner, at: new Date(now - day * (30 - id)) }]
    });

    const sampleNFTs = [

      // ── FOOTWEAR (6) ──
      nft(1,  'Nike Air Force 1 Low White',
          'NAF1-WHT-001', 'Footwear',
          'The iconic Nike Air Force 1 Low in classic all-white leather. Timeless silhouette with Air cushioning and durable rubber outsole.',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
          1, admin.email, admin.email),

      nft(2,  'Air Jordan 1 Retro High OG Chicago',
          'AJ1-CHI-002', 'Footwear',
          'The shoe that started it all. Premium leather upper in the legendary Chicago colorway — white, black, and varsity red.',
          'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
          2, admin.email, admin.email),

      nft(3,  'Nike Dunk Low Panda',
          'NDL-PND-003', 'Footwear',
          'Clean black and white Dunk Low with premium leather upper, padded collar, and classic Nike branding.',
          'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
          2, admin.email, admin.email),

      nft(4,  'Adidas Yeezy Boost 350 V2 Zebra',
          'YZY-ZBR-004', 'Footwear',
          'White and core black Primeknit upper with red SPLY-350 marking. Full-length Boost cushioning for all-day comfort.',
          'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
          3, buyer.email, admin.email),

      nft(5,  'New Balance 550 White Green',
          'NB550-WG-005', 'Footwear',
          'Retro basketball silhouette with leather and mesh upper. Clean white base with green accents.',
          'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
          2, admin.email, admin.email),

      nft(6,  'Converse Chuck Taylor All Star High',
          'CVS-CT-006', 'Footwear',
          'The original canvas high-top sneaker. Vulcanized rubber sole, medial eyelets, and iconic ankle patch.',
          'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800',
          1, admin.email, admin.email),

      // ── CLOTHING (6) ──
      nft(7,  'Supreme Box Logo Hoodie Black',
          'SUP-BLH-007', 'Clothing',
          'Heavy-weight cotton fleece hoodie with embroidered box logo on chest. Ribbed cuffs and hem.',
          'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800',
          3, admin.email, admin.email),

      nft(8,  'Off-White Diagonal Stripe Tee',
          'OFW-DST-008', 'Clothing',
          'Oversized cotton tee with signature diagonal stripe print and Helvetica text graphics.',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          2, admin.email, admin.email),

      nft(9,  'Stone Island Nylon Metal Jacket',
          'STI-NMJ-009', 'Clothing',
          'Garment-dyed nylon metal jacket with signature compass badge. Water-resistant finish.',
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
          3, admin.email, admin.email),

      nft(10, 'Palace Tri-Ferg Crewneck',
          'PAL-TFC-010', 'Clothing',
          'Heavyweight cotton crewneck with embroidered Tri-Ferg logo. Ribbed collar, cuffs, and hem.',
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
          2, buyer.email, admin.email),

      nft(11, 'Essentials Fear of God Sweatpants',
          'FOG-ESP-011', 'Clothing',
          'Relaxed-fit fleece sweatpants with rubberized logo. Elastic waistband with drawcord.',
          'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
          2, admin.email, admin.email),

      nft(12, 'Carhartt WIP Detroit Jacket',
          'CAR-DTJ-012', 'Clothing',
          'Classic Detroit jacket in 12oz cotton canvas. Blanket lining, multiple pockets, and snap buttons.',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          3, admin.email, admin.email),

      // ── ARTWORK (6) ──
      nft(13, 'Basquiat SAMO Crown Print',
          'BSQ-SAM-013', 'Artwork',
          'Limited edition giclee print of Jean-Michel Basquiat\'s iconic crown motif. Signed and numbered 1/50.',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
          3, admin.email, admin.email),

      nft(14, 'Banksy Flower Thrower Canvas',
          'BNK-FLW-014', 'Artwork',
          'High-quality canvas reproduction of Banksy\'s Flower Thrower. Stretched on wooden frame, ready to hang.',
          'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
          3, admin.email, admin.email),

      nft(15, 'KAWS Companion Poster',
          'KWS-CMP-015', 'Artwork',
          'Official KAWS Companion exhibition poster. Offset lithograph on 300gsm art paper.',
          'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800',
          2, admin.email, admin.email),

      nft(16, 'Takashi Murakami Flower Print',
          'MRK-FLW-016', 'Artwork',
          'Vibrant Murakami-style smiling flower print. Archival pigment ink on cotton rag paper.',
          'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
          3, buyer.email, admin.email),

      nft(17, 'Abstract Geometric Oil Painting',
          'ABS-GEO-017', 'Artwork',
          'Original abstract geometric oil painting on linen canvas. Bold primary colors with textured brushwork.',
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
          2, admin.email, admin.email),

      nft(18, 'Street Art Neon Typography',
          'STR-NEO-018', 'Artwork',
          'Urban street art inspired neon typography print. UV-reactive inks on black matte paper.',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          2, admin.email, admin.email),

      // ── ACCESSORIES (6) ──
      nft(19, 'Rolex Submariner Date Black',
          'RLX-SUB-019', 'Accessories',
          'Iconic Rolex Submariner with black ceramic bezel and dial. Oystersteel bracelet, 300m water resistance.',
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
          3, admin.email, admin.email),

      nft(20, 'Louis Vuitton Monogram Belt',
          'LV-MBT-020', 'Accessories',
          'Classic LV monogram canvas belt with gold-tone buckle. Adjustable length, made in France.',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
          2, admin.email, admin.email),

      nft(21, 'Ray-Ban Aviator Classic Gold',
          'RB-AVC-021', 'Accessories',
          'Timeless Ray-Ban Aviator with gold metal frame and G-15 green lenses. UV400 protection.',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
          1, admin.email, admin.email),

      nft(22, 'Gucci GG Canvas Cap',
          'GCC-CAP-022', 'Accessories',
          'Gucci GG Supreme canvas baseball cap with Web stripe and interlocking G logo.',
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
          2, buyer.email, admin.email),

      nft(23, 'Supreme New Era Box Logo Cap',
          'SUP-NE-023', 'Accessories',
          'Supreme x New Era fitted cap with embroidered box logo. Wool blend construction.',
          'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800',
          2, admin.email, admin.email),

      nft(24, 'Balenciaga Neo Classic Mini Bag',
          'BAL-NCM-024', 'Accessories',
          'Mini structured bag in grained calfskin with aged-gold hardware and detachable strap.',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
          3, admin.email, admin.email),

      // ── ELECTRONICS (6) ──
      nft(25, 'Apple AirPods Pro 2nd Gen',
          'APL-APP-025', 'Electronics',
          'Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio. MagSafe charging case.',
          'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800',
          3, admin.email, admin.email),

      nft(26, 'Sony WH-1000XM5 Headphones',
          'SNY-WH5-026', 'Electronics',
          'Industry-leading noise cancellation with 30-hour battery. Multipoint connection, speak-to-chat.',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          3, admin.email, admin.email),

      nft(27, 'Apple Watch Ultra 2 Titanium',
          'APL-AWU-027', 'Electronics',
          'Rugged titanium case, precision dual-frequency GPS, up to 60-hour battery. Action button.',
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
          3, buyer.email, admin.email),

      nft(28, 'DJI Mini 4 Pro Drone',
          'DJI-M4P-028', 'Electronics',
          '4K/60fps video, omnidirectional obstacle sensing, 34-min flight time. Under 249g.',
          'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
          3, admin.email, admin.email),

      nft(29, 'GoPro HERO12 Black',
          'GPR-H12-029', 'Electronics',
          '5.3K video, HyperSmooth 6.0 stabilization, waterproof to 10m. HDR photo and video.',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
          2, admin.email, admin.email),

      nft(30, 'Fujifilm Instax Mini 12',
          'FJF-IM12-030', 'Electronics',
          'Instant film camera with automatic exposure, close-up lens, and selfie mirror. Pastel mint.',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
          2, admin.email, admin.email),
    ];

    await NFT.insertMany(sampleNFTs);
    console.log(`\n✅ Created ${sampleNFTs.length} NFTs across 5 categories:`);
    console.log('   👟 Footwear   — 6 products (IDs 1–6)');
    console.log('   👕 Clothing   — 6 products (IDs 7–12)');
    console.log('   🎨 Artwork    — 6 products (IDs 13–18)');
    console.log('   👜 Accessories — 6 products (IDs 19–24)');
    console.log('   📱 Electronics — 6 products (IDs 25–30)');

    console.log('\n✅ Seed complete!\n');
    console.log('Demo credentials:');
    console.log('  Admin: admin@vaulttag.com / Admin@123');
    console.log('  Buyer: buyer@vaulttag.com / Buyer@123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
