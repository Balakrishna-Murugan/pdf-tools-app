const path = require('path');
const fs = require('fs-extra');
const { exec, execFile } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { convertPdfToWord } = require('../services/pdfToWordService');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const OUTPUT_DIR = path.join(__dirname, '..', 'outputs');

// Helper to cleanup files
async function cleanup(files = []) {
  for (const f of files) {
    try {
      await fs.unlink(f);
    } catch (err) {
      // ignore
    }
  }
}

// Convert DOCX to PDF using LibreOffice headless
async function wordToPdf(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const outputFilename = path.basename(inputPath, path.extname(inputPath)) + '.pdf';
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  // LibreOffice command -- assumes `soffice` or `libreoffice` is available on PATH.
  const sofficeCmd = process.env.LIBREOFFICE_BIN || (process.platform === 'win32' ? 'soffice.exe' : 'soffice');
  const cmd = `${sofficeCmd} --headless --convert-to pdf --outdir "${OUTPUT_DIR}" "${inputPath}"`;
  console.log('[wordToPdf] command:', cmd);

  exec(cmd, { timeout: 3 * 60 * 1000 }, async (err, stdout, stderr) => {
    console.log('[wordToPdf] stdout:', stdout);
    console.log('[wordToPdf] stderr:', stderr);
    if (err) {
      await cleanup([inputPath]);
      const detail = stderr || err.message;
      console.error('[wordToPdf] failed:', detail);
      return res.status(500).json({ error: 'Conversion failed', details: detail });
    }

    // Send generated PDF
    res.download(outputPath, outputFilename, async (downloadErr) => {
      // Clean up input and output
      await cleanup([inputPath, outputPath]);
      if (downloadErr) {
        console.error('Download error', downloadErr);
      }
    });
  });
}

// Convert PDF to DOCX using selectable engine and robust fallback
async function pdfToWord(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const engine = (req.body.engine || process.env.PDF_TO_WORD_ENGINE || 'auto').toLowerCase();
  const outputDir = OUTPUT_DIR;

  try {
    const convertedPath = await convertPdfToWord(inputPath, outputDir, { engine });
    const outputFilename = path.basename(convertedPath);
    res.download(convertedPath, outputFilename, async (err) => {
      await cleanup([inputPath, convertedPath]);
      if (err) {
        console.error('[pdfToWord] download error', err);
      }
    });
  } catch (err) {
    await cleanup([inputPath]);
    res.status(500).json({ error: 'PDF to Word conversion failed', details: err.message });
  }
}

// Merge PDFs using pdf-lib
async function mergePdf(req, res) {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  const files = req.files;
  const outputFilename = `merged-${Date.now()}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
        throw new Error('All files must be PDF for merge.');
      }
      const data = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(data);
      const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copied.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, mergedBytes);

    res.download(outputPath, outputFilename, async (err) => {
      // cleanup
      const paths = files.map(f => f.path).concat([outputPath]);
      await cleanup(paths);
      if (err) console.error('Download error', err);
    });
  } catch (err) {
    const paths = files.map(f => f.path);
    await cleanup(paths);
    res.status(500).json({ error: 'Merge failed', details: err.message });
  }
}

// Compress PDF using Ghostscript
async function compressPdf(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const outputFilename = path.basename(inputPath, path.extname(inputPath)) + '-compressed.pdf';
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  // Ghostscript binary - allow override via env.
  // On Windows, prefer a known installed path if GS_BIN not set.
  const windowsGsDefault = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe';
  const defaultGs = process.platform === 'win32' ? windowsGsDefault : 'gs';
  const gsCmd = process.env.GS_BIN || defaultGs;

  // If GS_BIN is absolute and missing, return clear error.
  if (path.isAbsolute(gsCmd) && !fs.existsSync(gsCmd)) {
    await cleanup([inputPath]);
    const msg = `Ghostscript binary not found at ${gsCmd}. Set GS_BIN to the correct executable path.`;
    console.error('[compressPdf] failed:', msg);
    return res.status(500).json({ error: 'Compression failed', details: msg });
  }

  const gsArgs = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    '-dPDFSETTINGS=/screen',
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];
  console.log('[compressPdf] command:', gsCmd, gsArgs.join(' '));

  execFile(gsCmd, gsArgs, { timeout: 2 * 60 * 1000 }, async (err, stdout, stderr) => {
    console.log('[compressPdf] stdout:', stdout);
    console.log('[compressPdf] stderr:', stderr);
    if (err) {
      await cleanup([inputPath]);
      const detail = stderr || err.message;
      console.error('[compressPdf] failed:', detail);

      if (err.code === 'ENOENT') {
        const msg = `Ghostscript binary not found (${gsCmd}). Install Ghostscript and either add it to PATH or set GS_BIN to the full binary path.`;
        return res.status(500).json({ error: 'Compression failed', details: msg });
      }

      return res.status(500).json({ error: 'Compression failed', details: detail });
    }

    res.download(outputPath, outputFilename, async (downloadErr) => {
      await cleanup([inputPath, outputPath]);
      if (downloadErr) console.error('Download error', downloadErr);
    });
  });
}

module.exports = { wordToPdf, pdfToWord, mergePdf, compressPdf };
