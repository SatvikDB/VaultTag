const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const nftController = require('../controllers/nft.controller');

const router = express.Router();

// Public — no auth
router.post('/verify', [
  body('tokenId').notEmpty().withMessage('Token ID is required')
], validate, nftController.verify);

// Protected routes
router.get('/my-nfts', auth, nftController.getMyNfts);
router.get('/all', auth, adminOnly, nftController.getAllNfts);
router.get('/:tokenId', auth, nftController.getNftDetail);

// Admin only
router.post('/mint', auth, adminOnly, [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('serialNumber').trim().notEmpty().withMessage('Serial number is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], validate, nftController.mint);

router.patch('/link-tag', auth, adminOnly, [
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('nfcUid').trim().notEmpty().withMessage('NFC UID is required')
], validate, nftController.linkTag);

// Protected
router.post('/redeem', auth, [
  body('tokenId').notEmpty().withMessage('Token ID is required')
], validate, nftController.redeem);

router.post('/transfer', auth, [
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('toEmail').isEmail().withMessage('Valid recipient email is required')
], validate, nftController.transfer);

module.exports = router;
