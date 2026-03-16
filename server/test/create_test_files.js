const fs = require('fs-extra');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun } = require('docx');

async function createPdf(outputPath) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const fontSize = 24;
  page.drawText('Sample PDF for smoke tests', {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
}

async function createDocx(outputPath) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [new Paragraph({ children: [new TextRun('Sample DOCX for smoke tests')] })],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
}

async function run() {
  const dir = path.join(__dirname, '..', 'test_files');
  await fs.ensureDir(dir);
  const pdfPath = path.join(dir, 'sample.pdf');
  const docxPath = path.join(dir, 'sample.docx');
  try {
    await createPdf(pdfPath);
    console.log('Created PDF at', pdfPath);
  } catch (err) {
    console.error('PDF creation failed', err);
  }
  try {
    await createDocx(docxPath);
    console.log('Created DOCX at', docxPath);
  } catch (err) {
    console.error('DOCX creation failed', err);
  }
}

run();
