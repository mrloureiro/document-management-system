const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');

const documentsController = require('../controllers/documents.controller');

const router = express.Router();

const storageDirectory = path.resolve(__dirname, '../../storage');

if (!fs.existsSync(storageDirectory)) {
  fs.mkdirSync(storageDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDirectory);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
    const sanitizedName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${uniquePrefix}-${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024),
  },
});

router.post('/upload', upload.single('file'), documentsController.createDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;
