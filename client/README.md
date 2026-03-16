# Client

This is a Vite + React frontend using Tailwind CSS.

Run locally (from /client):

npm install
npm run dev

The client expects the backend API at `http://localhost:4000/api` by default. You can override this by setting `VITE_API_BASE` in an `.env` file (Vite style):

VITE_API_BASE="http://localhost:4000/api"

Notes:
- The UI provides tools: Word to PDF, PDF to Word, Merge PDF, Compress PDF.
- Upload progress, error messages and download links are supported.
- Tailwind is set up via PostCSS. If your editor flags `@tailwind` rules as unknown, that's the CSS tooling and not a runtime error.
