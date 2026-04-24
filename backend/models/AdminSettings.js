const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  adminEmail:        { type: String, required: true, unique: true },
  upiId:             { type: String, default: '' },
  upiQrImage:        { type: String, default: '' },   // base64 data URL
  bankName:          { type: String, default: '' },
  accountNumber:     { type: String, default: '' },
  ifscCode:          { type: String, default: '' },
  accountHolder:     { type: String, default: '' },
  metamaskAddress:   { type: String, default: '' },
  apiProvider:       { type: String, default: '' },
  apiKeyPublic:      { type: String, default: '' },
  notificationEmail: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
