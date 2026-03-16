const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { wordToPdf, pdfToWord, mergePdf, compressPdf } = require('../controllers/convertController');

// Multer storage to /server/uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// File filter: only .pdf and .docx
function fileFilter(req, file, cb) {
  const allowed = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// Routes
router.post('/word-to-pdf', upload.single('file'), wordToPdf);
router.post('/pdf-to-word', upload.single('file'), pdfToWord);
router.post('/merge-pdf', upload.array('files', 10), mergePdf);
router.post('/compress-pdf', upload.single('file'), compressPdf);

module.exports = router;
