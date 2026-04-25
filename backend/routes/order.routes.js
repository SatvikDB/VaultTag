const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const c = require('../controllers/order.controller');

const router = express.Router();

// Public — get admin payment info for checkout page
router.get('/payment-info', c.getPublicPaymentInfo);

// Buyer
router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('Items required'),
  body('total').isNumeric().withMessage('Total required'),
  body('paymentMethod').isIn(['metamask','upi','api','card']).withMessage('Invalid payment method')
], validate, c.createOrder);

router.get('/my', auth, c.getMyOrders);
router.post('/razorpay/create', auth, c.createRazorpayOrder);

// Seller + Admin + SuperAdmin
router.get('/all', auth, requireRole('seller'), c.getAllOrders);
router.post('/:orderId/accept', auth, requireRole('seller'), c.acceptOrder);
router.post('/:orderId/transfer', auth, requireRole('seller'), c.transferOrder);
router.post('/:orderId/reject', auth, requireRole('seller'), c.rejectOrder);
router.get('/settings', auth, requireRole('seller'), c.getSettings);
router.post('/settings', auth, requireRole('seller'), c.saveSettings);

module.exports = router;
