# Server

Express server that exposes the following endpoints:

- POST /api/word-to-pdf     (field: file)  -> returns PDF
- POST /api/pdf-to-word     (field: file)  -> returns DOCX
- POST /api/merge-pdf       (field: files) -> returns merged PDF
- POST /api/compress-pdf    (field: file)  -> returns compressed PDF

Environment variables:
- LIBREOFFICE_BIN: path to LibreOffice `soffice` binary if not on PATH
- GS_BIN: path to Ghostscript binary (e.g. gswin64c.exe) if not on PATH

Install and run (from /server):

npm install
npm run dev

Notes:
- Uploaded files are stored temporarily in `uploads/` and outputs in `outputs/` and are removed after download.
- Max upload size: 20MB
- Allowed extensions: .pdf, .docx

Make sure LibreOffice and Ghostscript are installed and accessible on PATH for conversions to work.

Poppler (pdftotext) — optional but recommended for more robust PDF text extraction
--------------------------------------------------------------------------
To improve PDF->Word conversions the server can use Poppler's `pdftotext` as a fallback when `pdf-parse` fails to extract text.

Windows:
- Download Poppler precompiled binaries (e.g. https://github.com/oschwartz10612/poppler-windows/releases). Extract and add the `bin` folder to your PATH, or set the `PDFTOTEXT_BIN` environment variable to the full path of `pdftotext.exe`.

macOS / Linux:
- Install via package manager: `brew install poppler` (macOS) or `apt install poppler-utils` (Debian/Ubuntu).

If `pdftotext` is available on PATH the server will call it automatically as a fallback. You can also set `PDFTOTEXT_BIN` to override the executable path.
