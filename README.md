# PDF Tools App

Monorepo with a React (Vite) frontend and Node/Express backend to perform document operations: Word-to-PDF, PDF-to-Word, Merge PDF, Compress PDF.

Requirements:
- Node.js (16+ recommended)
- LibreOffice (for Word<->PDF conversions)
- Ghostscript (for compression)

Quick start (Windows PowerShell):

1. Install LibreOffice and Ghostscript (see instructions below).
2. From repo root:

   npm install
   npm run dev

This runs server and client concurrently.

Folder structure:

pdf-tools-app/
  client/   -> React + Vite frontend
  server/   -> Express backend with processing services

See each folder's README for more details.

LibreOffice install (Windows):
- Download: https://www.libreoffice.org/download/download/
- Ensure the LibreOffice `program` folder is on your PATH, or provide the binary path in environment if needed.

Ghostscript install (Windows):
- Download: https://www.ghostscript.com/download/gsdnld.html
- Ensure `gs` or `gswin64c.exe` is on your PATH.

Notes:
- Uploaded file size limited to 20MB.
- Allowed file types: .pdf, .docx
- Temporary files are removed after processing.

If you want to run only the server or client, navigate into `/server` or `/client` and run `npm install` and `npm run dev` there.

Example API requests (using curl):

# Word to PDF
curl -X POST -F "file=@/path/to/file.docx" http://localhost:4000/api/word-to-pdf --output out.pdf

# PDF to Word
curl -X POST -F "file=@/path/to/file.pdf" http://localhost:4000/api/pdf-to-word --output out.docx

# Merge PDF (multiple files)
curl -X POST -F "files=@/path/a.pdf" -F "files=@/path/b.pdf" http://localhost:4000/api/merge-pdf --output merged.pdf

# Compress PDF
curl -X POST -F "file=@/path/to/file.pdf" http://localhost:4000/api/compress-pdf --output compressed.pdf

Server environment tips:
- If LibreOffice/soffice isn't on your PATH, set environment variable `LIBREOFFICE_BIN` to the full path of the `soffice` executable.
- If Ghostscript binary is named differently on Windows, set `GS_BIN` to the full path (for example `C:\Program Files\gs\gs9.##\bin\gswin64c.exe`).

Security & cleanup:
- Uploads are limited to 20MB and only `.pdf` and `.docx` are accepted.
- Temporary files in `/server/uploads` and `/server/outputs` are removed after processing and download.
