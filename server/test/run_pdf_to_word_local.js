const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph } = require('docx');

async function run() {
  const inputPath = path.join(__dirname, '..', 'test_files', 'sample.pdf');
  const outputPath = path.join(__dirname, '..', 'test_files', 'out_local.docx');
  try {
    const dataBuffer = await fs.readFile(inputPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text || '';
    const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph(text || ' ')] }] });
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);
    console.log('Wrote', outputPath);
  } catch (err) {
    console.error('Error during pdf->docx local run:', err);
  }
}
run();
