import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import WordToPdf from './pages/WordToPdf'
import PdfToWord from './pages/PdfToWord'
import MergePdf from './pages/MergePdf'
import CompressPdf from './pages/CompressPdf'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen p-6">
        <header className="max-w-4xl mx-auto mb-6">
          <h1 className="text-3xl font-semibold">PDF Tools App</h1>
          <nav className="mt-4 space-x-4">
            <Link to="/" className="text-blue-600">Home</Link>
            <Link to="/word-to-pdf" className="text-blue-600">Word to PDF</Link>
            <Link to="/pdf-to-word" className="text-blue-600">PDF to Word</Link>
            <Link to="/merge-pdf" className="text-blue-600">Merge PDF</Link>
            <Link to="/compress-pdf" className="text-blue-600">Compress PDF</Link>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/word-to-pdf" element={<WordToPdf />} />
            <Route path="/pdf-to-word" element={<PdfToWord />} />
            <Route path="/merge-pdf" element={<MergePdf />} />
            <Route path="/compress-pdf" element={<CompressPdf />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
