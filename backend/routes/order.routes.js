const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const c = require('../controllers/order.controller');

const router = express.Router();

// Public — get admin payment info for checkout page
router.get('/payment-info', c.getPublicPaymentInfo);

// Buyer
router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('Items required'),
  body('total').isNumeric().withMessage('Total required'),
  body('paymentMethod').isIn(['metamask','upi','api']).withMessage('Invalid payment method')
], validate, c.createOrder);

router.get('/my', auth, c.getMyOrders);

// Admin
router.get('/all', auth, adminOnly, c.getAllOrders);
router.post('/:orderId/accept', auth, adminOnly, c.acceptOrder);
router.post('/:orderId/transfer', auth, adminOnly, c.transferOrder);
router.post('/:orderId/reject', auth, adminOnly, c.rejectOrder);
router.get('/settings', auth, adminOnly, c.getSettings);
router.post('/settings', auth, adminOnly, c.saveSettings);

module.exports = router;
