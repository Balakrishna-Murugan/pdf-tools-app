import React, { useState } from 'react'
import FileUploader from '../components/FileUploader'
import ProgressBar from '../components/ProgressBar'
import ResultDownload from '../components/ResultDownload'
import { uploadFile } from '../services/api'

export default function WordToPdf() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState(null)

  function handleFiles(files) {
    setError(null)
    const f = files[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.docx')) {
      setError('Invalid file type. Please upload a .docx file.')
      return
    }
    setFile(f)
  }

  async function handleConvert() {
    if (!file) return setError('No file selected')
    const formData = new FormData()
    formData.append('file', file)

    try {
      setProgress(0)
      setResultUrl(null)
      const res = await uploadFile('/word-to-pdf', formData, setProgress)
      // create blob url
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      setResultUrl(url)
      const cd = res.headers['content-disposition'] || ''
      const filename = cd.match(/filename="?(.*)"?/)?.[1] || (file.name.replace(/\.docx$/i, '.pdf'))
      setResultName(filename)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Word to PDF</h2>
      <FileUploader accept=".docx" onFiles={handleFiles} />
      {file && <div className="mt-3">Selected: {file.name}</div>}
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
