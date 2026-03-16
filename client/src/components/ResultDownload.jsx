import React from 'react'

export default function ResultDownload({ url, filename }) {
  if (!url) return null;
  return (
    <div className="mt-4">
      <a href={url} download={filename} className="px-4 py-2 bg-green-600 text-white rounded">Download {filename}</a>
    </div>
  )
}
