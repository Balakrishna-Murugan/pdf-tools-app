import React, { useRef, useState } from 'react'

export default function FileUploader({ multiple = false, accept = '*', onFiles }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    if (onFiles) onFiles(files);
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed p-6 rounded text-center ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          handleFiles(multiple ? files : files.slice(0,1));
        }}
      >
        <p className="mb-2">Drag & drop files here, or</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => inputRef.current.click()}
        >Select files</button>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />
      </div>
    </div>
  )
}
