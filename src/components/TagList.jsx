import { useState, useEffect, useRef } from 'react'
import './TagList.css'

function TagList({ items, onAdd, onUpdate, onDelete, placeholder = "Add item...", defaultType = "like", allowTypeSelection = true }) {
  const [activeTagId, setActiveTagId] = useState(null)
  const [editingTagId, setEditingTagId] = useState(null)
  const [editText, setEditText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newTagText, setNewTagText] = useState('')
  const [newTagType, setNewTagType] = useState(defaultType)
  const inputRef = useRef(null)
  const newTagInputRef = useRef(null)

  // Sort items: likes first, then dislikes
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === b.type) return 0
    return a.type === 'like' ? -1 : 1
  })

  useEffect(() => {
    if (editingTagId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingTagId])

  useEffect(() => {
    if (isAdding && newTagInputRef.current) {
      newTagInputRef.current.focus()
    }
  }, [isAdding])

  const handleTagClick = (item) => {
    if (activeTagId === item.id) return
    setActiveTagId(item.id)
    setEditingTagId(null)
  }

  const handleEditClick = (item, e) => {
    e.stopPropagation()
    setEditingTagId(item.id)
    setEditText(item.text)
  }

  const handleDeleteClick = (item, e) => {
    e.stopPropagation()
    onDelete(item.id)
    setActiveTagId(null)
  }

  const handleSaveClick = (item, e) => {
    e.stopPropagation()
    if (editingTagId === item.id) {
      if (editText.trim()) {
        onUpdate(item.id, editText.trim())
      }
      setEditingTagId(null)
    }
    setActiveTagId(null)
  }

  const handleCancelClick = (e) => {
    e.stopPropagation()
    setActiveTagId(null)
    setEditingTagId(null)
  }

  const handleAddSubmit = () => {
    if (newTagText.trim()) {
      onAdd(newTagText.trim(), newTagType)
      setNewTagText('')
      // Keep adding mode open or close? Usually nice to add multiple.
      // But user requirement: "po kliknuti musi ... objevit 3 moznosti".
      // For adding, we probably just want to add and maybe stay or close.
      // Let's reset text but keep adding if they want, or maybe close. 
      // Let's close for now to be safe.
      setIsAdding(false)
    } else {
        setIsAdding(false)
    }
  }

  return (
    <div className="tag-list">
      {sortedItems.map(item => (
        <div 
          key={item.id} 
          className={`tag-item ${item.type || 'neutral'} ${activeTagId === item.id ? 'active' : ''}`}
          onClick={() => handleTagClick(item)}
        >
          {activeTagId === item.id ? (
            <div className="tag-actions-overlay">
              {editingTagId === item.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveClick(item, e)
                    if (e.key === 'Escape') setEditingTagId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="tag-edit-input"
                />
              ) : (
                <div className="tag-actions-buttons">
                  <button className="action-btn edit" onClick={(e) => handleEditClick(item, e)} title="Edit">
                    ✏️
                  </button>
                  <button className="action-btn delete" onClick={(e) => handleDeleteClick(item, e)} title="Delete">
                    ❌
                  </button>
                </div>
              )}
              <button className="action-btn save" onClick={(e) => handleSaveClick(item, e)} title="Save/Exit">
                ✅
              </button>
            </div>
          ) : (
            <span className="tag-text">{item.text}</span>
          )}
        </div>
      ))}

      {/* Add Button / Form */}
      {isAdding ? (
        <div className={`tag-item add-form ${newTagType}`}>
           {allowTypeSelection && (
             <select 
              value={newTagType} 
              onChange={(e) => setNewTagType(e.target.value)}
              className="type-select"
              onClick={(e) => e.stopPropagation()}
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
               if (e.key === 'Enter') handleAddSubmit()
               if (e.key === 'Escape') setIsAdding(false)
             }}
             placeholder="Tag name..."
             className="tag-add-input"
           />
           <button onClick={handleAddSubmit} className="action-btn save">✅</button>
           <button onClick={() => setIsAdding(false)} className="action-btn cancel">❌</button>
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

