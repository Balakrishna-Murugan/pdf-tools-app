import React from 'react'

export default function ProgressBar({ percent = 0 }) {
  return (
    <div className="w-full bg-gray-200 rounded h-3">
      <div className="bg-blue-600 h-3 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}
