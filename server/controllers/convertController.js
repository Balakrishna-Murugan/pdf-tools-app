const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { PDFDocument } = require('pdf-lib');
const mime = require('mime-types');

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

// Convert PDF to DOCX by extracting text and writing a simple .docx
async function pdfToWord(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const outputFilename = path.basename(inputPath, path.extname(inputPath)) + '.docx';
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  try {
    // Try pdf-parse first
    let text = '';
    try {
      const dataBuffer = await fs.readFile(inputPath);
      const data = await pdfParse(dataBuffer);
      text = data.text || '';
    } catch (parseErr) {
      // pdf-parse failed; try pdftotext (Poppler) as a fallback
      console.warn('pdf-parse failed, attempting pdftotext fallback:', parseErr.message);
      const pdftotextCmd = process.env.PDFTOTEXT_BIN || (process.platform === 'win32' ? 'pdftotext.exe' : 'pdftotext');
      // Use -enc UTF-8 and - to write to stdout
      const cmd = `"${pdftotextCmd}" -enc UTF-8 "${inputPath}" -`;
      console.log('[pdfToWord] pdftotext command:', cmd);
      try {
        text = await new Promise((resolve, reject) => {
          exec(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 2 * 60 * 1000 }, (err, stdout, stderr) => {
            console.log('[pdfToWord] pdftotext stdout:', stdout);
            console.log('[pdfToWord] pdftotext stderr:', stderr);
            if (err) return reject(new Error(`pdftotext failed: ${stderr || err.message}`));
            resolve(stdout || '');
          });
        });
      } catch (pdftotextErr) {
        // Neither pdf-parse nor pdftotext worked
        await cleanup([inputPath]);
        // If pdftotext isn't available, give a clear message
        const msg = (pdftotextErr && pdftotextErr.message) || '';
        if (msg.includes('ENOENT') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('pdftotext')) {
          return res.status(500).json({ error: 'PDF to Word failed: pdftotext (Poppler) not found on the server. Install Poppler or set PDFTOTEXT_BIN to the pdftotext executable path.' });
        }
        return res.status(500).json({ error: 'PDF to Word failed: unable to extract text from PDF', details: pdftotextErr.message });
      }
    }

    // Create a simple docx from extracted text
    const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph(text || ' ')] }] });
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);

    res.download(outputPath, outputFilename, async (err) => {
      await cleanup([inputPath, outputPath]);
      if (err) console.error('Download error', err);
    });
  } catch (err) {
    await cleanup([inputPath]);
    res.status(500).json({ error: 'PDF to Word failed', details: err.message });
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

  // Ghostscript binary - allow override via env
  const gsCmd = process.env.GS_BIN || (process.platform === 'win32' ? 'gswin64c.exe' : 'gs');
  // Typical command for Ghostscript compression
  const cmd = `${gsCmd} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
  console.log('[compressPdf] command:', cmd);

  exec(cmd, { timeout: 2 * 60 * 1000 }, async (err, stdout, stderr) => {
    console.log('[compressPdf] stdout:', stdout);
    console.log('[compressPdf] stderr:', stderr);
    if (err) {
      await cleanup([inputPath]);
      const detail = stderr || err.message;
      console.error('[compressPdf] failed:', detail);
      return res.status(500).json({ error: 'Compression failed', details: detail });
    }

    res.download(outputPath, outputFilename, async (downloadErr) => {
      await cleanup([inputPath, outputPath]);
      if (downloadErr) console.error('Download error', downloadErr);
    });
  });
}

module.exports = { wordToPdf, pdfToWord, mergePdf, compressPdf };
