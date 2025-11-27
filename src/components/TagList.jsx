import { useState, useEffect, useRef, useCallback } from 'react'
import './TagList.css'

function TagList({ items, onAdd, onUpdate, onDelete, placeholder = "Add item...", defaultType = "like", allowTypeSelection = true }) {
  const [editingTagId, setEditingTagId] = useState(null)
  const [editText, setEditText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newTagText, setNewTagText] = useState('')
  const [newTagType, setNewTagType] = useState(defaultType)
  const inputRef = useRef(null)
  const newTagInputRef = useRef(null)
  const addFormRef = useRef(null)

  // Sort items: likes first, then dislikes
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === b.type) return 0
    return a.type === 'like' ? -1 : 1
  })

  useEffect(() => {
    if (editingTagId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTagId])

  useEffect(() => {
    if (isAdding && newTagInputRef.current) {
      newTagInputRef.current.focus()
    }
  }, [isAdding])

  const beginEditing = (item) => {
    if (editingTagId === item.id) return
    setEditingTagId(item.id)
    setEditText(item.text)
  }

  const commitEdit = () => {
    if (!editingTagId) return
    const target = items.find(i => i.id === editingTagId)
    const trimmed = editText.trim()
    if (target && trimmed && trimmed !== target.text) {
      onUpdate(editingTagId, trimmed)
    }
    setEditingTagId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingTagId(null)
    setEditText('')
  }

  const handleDeleteClick = (item) => {
    onDelete(item.id)
    if (editingTagId === item.id) {
      cancelEdit()
    }
  }

  const handleAddSubmit = useCallback(() => {
    if (!isAdding) return
    const trimmed = newTagText.trim()
    if (trimmed) {
      const typeToUse = allowTypeSelection ? newTagType : defaultType
      onAdd(trimmed, typeToUse)
    }
    setNewTagText('')
    setIsAdding(false)
  }, [isAdding, newTagText, allowTypeSelection, newTagType, defaultType, onAdd])

  const handleAddCancel = useCallback(() => {
    setIsAdding(false)
    setNewTagText('')
  }, [])

  useEffect(() => {
    if (!isAdding) return
    const handleClickOutside = (event) => {
      if (addFormRef.current && !addFormRef.current.contains(event.target)) {
        handleAddSubmit()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isAdding, handleAddSubmit])

  return (
    <div className="tag-list">
      {sortedItems.map(item => (
        <div 
          key={item.id} 
          className={`tag-item ${item.type || 'neutral'} ${editingTagId === item.id ? 'editing' : ''}`}
        >
          {editingTagId === item.id ? (
            <div className="tag-edit-wrapper">
              <span className="tag-measure-span">{editText}</span>
              <input
                ref={inputRef}
                type="text"
                size={1}
                className="tag-inline-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitEdit()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    cancelEdit()
                  }
                }}
              />
            </div>
          ) : (
            <span 
              className="tag-text" 
              onClick={() => beginEditing(item)}
            >
              {item.text}
            </span>
          )}
          <button
            className="tag-remove-btn"
            title="Remove"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleDeleteClick(item)}
          >
            ×
          </button>
        </div>
      ))}

      {/* Add Button / Form */}
      {isAdding ? (
        <div ref={addFormRef} className={`tag-item add-form ${newTagType}`}>
          {allowTypeSelection && (
            <select 
              value={newTagType} 
              onChange={(e) => setNewTagType(e.target.value)}
              className="type-select"
            >
              <option value="like">Like</option>
              <option value="dislike">Dislike</option>
            </select>
          )}
          <input
            ref={newTagInputRef}
            type="text"
            value={newTagText}
            onChange={(e) => setNewTagText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddSubmit()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                handleAddCancel()
              }
            }}
            placeholder={placeholder}
            className="tag-add-input"
          />
          <button
            className="tag-remove-btn add-cancel"
            title="Cancel"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAddCancel}
          >
            ×
          </button>
        </div>
      ) : (
        <button className="tag-item add-btn" onClick={() => setIsAdding(true)}>
          +
        </button>
      )}
    </div>
  )
}

export default TagList

