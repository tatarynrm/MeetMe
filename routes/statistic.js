const express = require('express');
const { getAllUsersCount } = require('../controllers/web/sttistic');

// Create a router instance
const router = express.Router();
router.route('/statistic-users').get(getAllUsersCount)

module.exports = router