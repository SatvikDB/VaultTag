const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const requireRole = require('../middleware/requireRole');
const { getStats, getUsers, deleteNft, dbExplorer } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats', auth, requireRole('seller'), getStats);
router.get('/users', auth, adminOnly, getUsers);
router.get('/db-explorer', auth, adminOnly, dbExplorer);
router.delete('/nft/:tokenId', auth, requireRole('seller'), deleteNft);

module.exports = router;
