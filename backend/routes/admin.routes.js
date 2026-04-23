const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { getStats, getUsers, deleteNft } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats', auth, adminOnly, getStats);
router.get('/users', auth, adminOnly, getUsers);
router.delete('/nft/:tokenId', auth, adminOnly, deleteNft);

module.exports = router;
