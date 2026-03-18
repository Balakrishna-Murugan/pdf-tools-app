const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { ...options, maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`${err.message}\n${stderr || ''}`));
      resolve({ stdout, stderr });
    });
  });
}

async function hasSelectableText(pdfPath) {
  const pdftotextCmd = process.env.PDFTOTEXT_BIN || (process.platform === 'win32' ? 'pdftotext.exe' : 'pdftotext');
  const cmd = `"${pdftotextCmd}" -layout "${pdfPath}" -`;
  try {
    const { stdout } = await runCommand(cmd, { timeout: 2 * 60 * 1000 });
    const text = stdout.trim();
    return text.length > 100;
  } catch {
    return false;
  }
}

async function convertWithLibreOffice(pdfPath, outputDir) {
  const sofficeCmd = process.env.LIBREOFFICE_BIN || (process.platform === 'win32' ? 'soffice.exe' : 'soffice');
  const cmd = `"${sofficeCmd}" --headless --infilter=writer_pdf_import --convert-to docx --outdir "${outputDir}" "${pdfPath}"`;
  await runCommand(cmd, { timeout: 4 * 60 * 1000 });
  const outPath = path.join(outputDir, `${path.basename(pdfPath, path.extname(pdfPath))}.docx`);
  if (!(await fs.pathExists(outPath))) {
    throw new Error('LibreOffice conversion did not produce output DOCX');
  }
  return outPath;
}

async function convertWithTesseractPandoc(pdfPath, outputDir) {
  const base = path.join(outputDir, `ocr-${Date.now()}`);
  const txtPath = `${base}.txt`;
  const tesseractCmd = process.env.TESSERACT_BIN || (process.platform === 'win32' ? 'tesseract.exe' : 'tesseract');

  await runCommand(`"${tesseractCmd}" "${pdfPath}" "${base}" -l eng txt`, { timeout: 5 * 60 * 1000 });
  if (!(await fs.pathExists(txtPath))) {
    throw new Error('Tesseract OCR did not produce text output');
  }

  const outPath = path.join(outputDir, `${path.basename(pdfPath, path.extname(pdfPath))}-ocr.docx`);
  const pandocCmd = `pandoc "${txtPath}" -o "${outPath}"`;
  await runCommand(pandocCmd, { timeout: 3 * 60 * 1000 });
  if (!(await fs.pathExists(outPath))) {
    throw new Error('Pandoc conversion from OCR text failed');
  }
  return outPath;
}

async function convertWithImagePages(pdfPath, outputDir) {
  const gsCmd = process.env.GS_BIN || (process.platform === 'win32' ? 'gswin64c.exe' : 'gs');
  const tmpDir = path.join(outputDir, `pages-${Date.now()}`);
  await fs.mkdirp(tmpDir);
  const outputPattern = path.join(tmpDir, 'page-%03d.png');
  const cmd = `"${gsCmd}" -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r200 -sOutputFile="${outputPattern}" "${pdfPath}"`;
  await runCommand(cmd, { timeout: 4 * 60 * 1000 });
  const images = (await fs.readdir(tmpDir)).filter((f) => f.toLowerCase().endsWith('.png')).sort();
  if (images.length === 0) {
    await fs.remove(tmpDir);
    throw new Error('Ghostscript produced no image pages');
  }

  const docxPath = path.join(outputDir, `${path.basename(pdfPath, path.extname(pdfPath))}-image.docx`);
  const markdownPath = path.join(tmpDir, 'pages.md');
  let md = '';
  for (const imageName of images) {
    const imagePath = path.join(tmpDir, imageName);
    md += `![page](${imagePath})\n\n`;
  }
  await fs.writeFile(markdownPath, md, 'utf8');

  const pandocCmd = `pandoc "${markdownPath}" -o "${docxPath}"`;
  await runCommand(pandocCmd, { timeout: 3 * 60 * 1000 });
  await fs.remove(tmpDir);

  if (!(await fs.pathExists(docxPath))) {
    throw new Error('Pandoc image-based DOCX conversion failed');
  }
  return docxPath;
}

async function convertPdfToWord(pdfPath, outputDir, options = {}) {
  const engine = (options.engine || process.env.PDF_TO_WORD_ENGINE || 'auto').toLowerCase();
  await fs.mkdirp(outputDir);

  if (engine === 'libreoffice') {
    return await convertWithLibreOffice(pdfPath, outputDir);
  }
  if (engine === 'ocr') {
    return await convertWithTesseractPandoc(pdfPath, outputDir);
  }
  if (engine === 'image') {
    return await convertWithImagePages(pdfPath, outputDir);
  }

  // Auto-detect
  const hasText = await hasSelectableText(pdfPath);
  if (hasText) {
    try {
      return await convertWithLibreOffice(pdfPath, outputDir);
    } catch (e) {
      console.warn('[pdfToWordService] libreoffice failed, falling back to OCR', e.message);
    }
  }

  try {
    return await convertWithTesseractPandoc(pdfPath, outputDir);
  } catch (e) {
    console.warn('[pdfToWordService] OCR fallback failed', e.message);
  }

  return await convertWithImagePages(pdfPath, outputDir);
}

module.exports = {
  convertPdfToWord,
  hasSelectableText,
  convertWithLibreOffice,
  convertWithTesseractPandoc,
  convertWithImagePages,
};
