const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const requireRole = require('../middleware/requireRole');
const { getStats, getUsers, deleteNft, dbExplorer, createAdmin, deleteUser, toggleBlockUser, getRevenueReport } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats',            auth, requireRole('seller'), getStats);
router.get('/users',            auth, adminOnly, getUsers);
router.get('/db-explorer',      auth, adminOnly, dbExplorer);
router.delete('/nft/:tokenId',  auth, requireRole('seller'), deleteNft);

// SuperAdmin-only routes
router.post('/create-admin',         auth, requireRole('superadmin'), createAdmin);
router.delete('/user/:userId',       auth, requireRole('superadmin'), deleteUser);
router.patch('/user/:userId/block',  auth, requireRole('superadmin'), toggleBlockUser);
router.get('/revenue-report',        auth, requireRole('superadmin'), getRevenueReport);

module.exports = router;
