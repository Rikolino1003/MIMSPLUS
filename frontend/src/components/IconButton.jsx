import React from 'react'

export default function IconButton({ onClick, children, className = '', title }){
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1 rounded-md shadow-sm transition-colors ${className}`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  )
}
