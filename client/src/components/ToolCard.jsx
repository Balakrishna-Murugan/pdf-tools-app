import React from 'react'

export default function ToolCard({ title, description, to }) {
  return (
    <div className="border p-4 rounded">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <a href={to} className="mt-3 inline-block text-blue-600">Open</a>
    </div>
  )
}
