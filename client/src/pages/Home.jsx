import React from 'react'
import ToolCard from '../components/ToolCard'

export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ToolCard title="Word to PDF" description="Convert .docx to PDF using LibreOffice" to="/word-to-pdf" />
      <ToolCard title="PDF to Word" description="Extract text from PDF and return a .docx" to="/pdf-to-word" />
      <ToolCard title="Merge PDF" description="Upload multiple PDFs and merge into one" to="/merge-pdf" />
      <ToolCard title="Compress PDF" description="Compress PDFs using Ghostscript" to="/compress-pdf" />
    </div>
  )
}
