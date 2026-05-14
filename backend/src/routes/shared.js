const express = require('express');
const { getSharedNote } = require('../controllers/sharedController');

const router = express.Router();

router.get('/:shareId', getSharedNote);

module.exports = router;
