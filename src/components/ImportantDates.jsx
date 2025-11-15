import { useState } from 'react'
import { format } from 'date-fns'
import { updateData } from '../utils/storage'
import './ImportantDates.css'

function ImportantDates({ data, onUpdate, onExpandChange }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleExpandChange = (expanded) => {
    setIsExpanded(expanded)
    if (onExpandChange) {
      onExpandChange(expanded)
    }
  }
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    gifts: '',
  })

  const showAddForm = isAdding && !editingId

  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    const newDate = {
      id: editingId || Date.now(),
      name: formData.name,
      date: formData.date,
      gifts: formData.gifts.trim(), // Store as string to preserve line breaks
    }
    
    let updatedDates
    if (editingId) {
      // Update existing date
      updatedDates = data.importantDates.map(d => 
        d.id === editingId ? newDate : d
      )
    } else {
      // Add new date
      updatedDates = [...data.importantDates, newDate]
    }
    
    const newData = updateData({
      importantDates: updatedDates
    })
    onUpdate(newData)
    setFormData({ name: '', date: '', gifts: '' })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleEdit = (dateObj) => {
    setEditingId(dateObj.id)
    setIsAdding(true)
    // Handle both old format (array) and new format (string)
    const giftsText = dateObj.gifts 
      ? (Array.isArray(dateObj.gifts) ? dateObj.gifts.join(', ') : dateObj.gifts)
      : ''
    setFormData({
      name: dateObj.name,
      date: dateObj.date,
      gifts: giftsText,
    })
  }

  const handleCancel = () => {
    setFormData({ name: '', date: '', gifts: '' })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleFieldKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    } else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
      e.preventDefault()
      const fakeEvent = { preventDefault: () => {} }
      handleSubmit(fakeEvent)
    }
  }

  const handleDelete = (id) => {
    const newData = updateData({
      importantDates: data.importantDates.filter(d => d.id !== id)
    })
    onUpdate(newData)
  }


  return (
    <div className={`important-dates card ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className="card-header expandable-header-clickable"
        onClick={() => handleExpandChange(!isExpanded)}
      >
        <div className="header-content">
          <h3>📅 Important Dates</h3>
          <span className="expand-icon-down">{isExpanded ? '▲' : '▼'}</span>
        </div>
        {isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              if (isAdding) {
                handleCancel()
              } else {
                setIsAdding(true)
                setEditingId(null)
                setFormData({ name: '', date: '', gifts: '' })
              }
            }}
            className="header-add-btn"
          >
            {isAdding ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          <div>
      {showAddForm && (
        <form onSubmit={handleSubmit} className="date-form" onKeyDown={handleFieldKeyDown}>
          <div className="form-group">
            <label>Event Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Birthday, Anniversary"
              required
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.gifts}
              onChange={(e) => setFormData({ ...formData, gifts: e.target.value })}
              placeholder="e.g., Flowers, Chocolate, Book"
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Date
            </button>
          </div>
        </form>
      )}

      <div className="dates-list">
        {data.importantDates.length === 0 ? (
          <p className="empty-state">No important dates yet. Click + Add to add one.</p>
        ) : (
          data.importantDates
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(dateObj => {
              return (
                <div key={dateObj.id} className="date-item">
                  {editingId === dateObj.id ? (
                    <form
                      onSubmit={handleSubmit}
                      className="date-form inline"
                      onKeyDown={handleFieldKeyDown}
                    >
                      <div className="form-group">
                        <label>Event Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Notes</label>
                        <textarea
                          value={formData.gifts}
                          onChange={(e) => setFormData({ ...formData, gifts: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCancel}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Update Date
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="date-header">
                        <h4>{dateObj.name}</h4>
                        <div className="date-actions">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(dateObj)}
                            title="Edit date"
                          >
                            ✏️
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(dateObj.id)}
                            title="Delete date"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="date-info">
                        <div className="date-main">
                          <span className="date-label">Date:</span>
                          <span className="date-value">{format(new Date(dateObj.date), 'dd/MM/yyyy')}</span>
                        </div>
                        {dateObj.gifts && (Array.isArray(dateObj.gifts) ? dateObj.gifts.length > 0 : dateObj.gifts.trim().length > 0) && (
                          <div className="gifts">
                            <span className="gifts-label">Notes:</span>
                            <div className="gifts-text">
                              {Array.isArray(dateObj.gifts) 
                                ? dateObj.gifts.map((gift, i) => (
                                    <span key={i} className="gift-tag">{gift}</span>
                                  ))
                                : <div className="gifts-multiline">{dateObj.gifts}</div>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })
        )}
          </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ImportantDates

