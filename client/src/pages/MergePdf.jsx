import React, { useState } from 'react'
import FileUploader from '../components/FileUploader'
import ProgressBar from '../components/ProgressBar'
import ResultDownload from '../components/ResultDownload'
import { uploadFile } from '../services/api'

export default function MergePdf() {
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState(null)

  function handleFiles(selected) {
    setError(null)
    // filter only PDFs
    const pdfs = selected.filter(f => f.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length !== selected.length) setError('Only PDF files accepted; non-PDFs were ignored.')
    // check size
    const oversized = pdfs.find(f => f.size > 20 * 1024 * 1024)
    if (oversized) return setError('One or more files exceed the 20MB upload limit.')
    setFiles(pdfs)
  }

  async function handleMerge() {
    if (!files.length) return setError('No files selected')
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    try {
      setProgress(0)
      setResultUrl(null)
      const res = await uploadFile('/merge-pdf', formData, setProgress)
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      setResultUrl(url)
      const cd = res.headers['content-disposition'] || ''
      const filename = cd.match(/filename="?(.*)"?/)?.[1] || ('merged.pdf')
      setResultName(filename)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Merge PDF</h2>
      <FileUploader multiple accept=".pdf" onFiles={handleFiles} />
      {files.length > 0 && <div className="mt-3">Selected: {files.map(f => f.name).join(', ')}</div>}
      {files.length > 0 && (
        <div className="mt-3">
          <embed src={URL.createObjectURL(files[0])} type="application/pdf" width="100%" height="400px" />
        </div>
      )}
      {error && <div className="mt-3 text-red-600">{error}</div>}

      <div className="mt-4 flex items-center space-x-3">
        <button onClick={handleMerge} className="px-4 py-2 bg-blue-600 text-white rounded">Merge</button>
        <div className="flex-1">
          <ProgressBar percent={progress} />
        </div>
      </div>

      <ResultDownload url={resultUrl} filename={resultName} />
    </div>
  )
}
