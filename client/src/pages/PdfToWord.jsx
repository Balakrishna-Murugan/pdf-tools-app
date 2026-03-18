import React, { useState } from 'react'
import FileUploader from '../components/FileUploader'
import ProgressBar from '../components/ProgressBar'
import ResultDownload from '../components/ResultDownload'
import { uploadFile } from '../services/api'

export default function PdfToWord() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState(null)
  const [engine, setEngine] = useState('libreoffice')

  function handleFiles(files) {
    setError(null)
    const f = files[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file type. Please upload a .pdf file.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum size is 20MB.')
      return
    }
    setFile(f)
  }

  async function handleConvert() {
    if (!file) return setError('No file selected')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('engine', engine)

    try {
      setProgress(0)
      setResultUrl(null)
      const res = await uploadFile('/pdf-to-word', formData, setProgress)
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      setResultUrl(url)
      const cd = res.headers['content-disposition'] || ''
      const filename = cd.match(/filename="?(.*)"?/)?.[1] || (file.name.replace(/\.pdf$/i, '.docx'))
      setResultName(filename)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">PDF to Word</h2>
      <FileUploader accept=".pdf" onFiles={handleFiles} />
      {file && <div className="mt-3">Selected: {file.name}</div>}
      {file && file.type === 'application/pdf' && (
        <div className="mt-3">
          <embed src={URL.createObjectURL(file)} type="application/pdf" width="100%" height="400px" />
        </div>
      )}
      <div className="mt-3">
        <label className="block text-sm font-medium">Conversion engine</label>
        <select value={engine} onChange={(e) => setEngine(e.target.value)} className="mt-1 p-2 border rounded w-full">
          <option value="libreoffice">LibreOffice (local)</option>
          <option value="image">Image pages (exact visual fidelity, image-based)</option>
          <option value="ocr">OCR text fallback (scanned PDFs to text + Word)</option>
          <option value="cloud">Cloud (exact fidelity, requires API key)</option>
        </select>
      </div>
      {error && <div className="mt-3 text-red-600">{error}</div>}
      <div className="mt-4 flex items-center space-x-3">
        <button onClick={handleConvert} className="px-4 py-2 bg-blue-600 text-white rounded">Convert</button>
        <div className="flex-1">
          <ProgressBar percent={progress} />
        </div>
      </div>

      <ResultDownload url={resultUrl} filename={resultName} />
    </div>
  )
}
