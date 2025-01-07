const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadController.uploadFile);

module.exports = router;
