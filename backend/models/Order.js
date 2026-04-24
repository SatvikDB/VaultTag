const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId:        { type: String, required: true, unique: true },
  buyer:          { type: String, required: true },   // email
  buyerName:      { type: String, default: '' },
  items: [{
    tokenId:     Number,
    productName: String,
    price:       Number,
    imageUrl:    String,
    category:    String
  }],
  subtotal:       { type: Number, required: true },
  fee:            { type: Number, default: 0 },
  total:          { type: Number, required: true },
  paymentMethod:  { type: String, enum: ['metamask','upi','api'], required: true },
  paymentRef:     { type: String, default: '' },
  shippingAddress:{ type: String, default: '' },
  status:         { type: String, enum: ['pending','accepted','rejected','completed'], default: 'pending' },
  adminNote:      { type: String, default: '' },
  acceptedAt:     { type: Date, default: null },
  emailSent:      { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
