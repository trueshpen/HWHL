import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { updateData } from '../utils/storage'
import './ImportantDates.css'

function ImportantDates({ data, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    gifts: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newDate = {
      id: editingId || Date.now(),
      name: formData.name,
      date: formData.date,
      gifts: formData.gifts.split(',').map(g => g.trim()).filter(g => g),
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
    setFormData({
      name: dateObj.name,
      date: dateObj.date,
      gifts: dateObj.gifts ? dateObj.gifts.join(', ') : '',
    })
  }

  const handleCancel = () => {
    setFormData({ name: '', date: '', gifts: '' })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleDelete = (id) => {
    const newData = updateData({
      importantDates: data.importantDates.filter(d => d.id !== id)
    })
    onUpdate(newData)
  }

  const getNotifications = (dateStr) => {
    const date = new Date(dateStr)
    return {
      monthBefore: format(addDays(date, -30), 'd MMM'),
      weekBefore: format(addDays(date, -7), 'd MMM'),
      dayBefore: format(addDays(date, -1), 'd MMM'),
      dayOf: format(date, 'd MMM'),
    }
  }

  return (
    <div className="important-dates card">
      <div className="card-header">
        <h3>📅 Important Dates</h3>
        <button onClick={() => {
          if (isAdding) {
            handleCancel()
          } else {
            setIsAdding(true)
            setEditingId(null)
            setFormData({ name: '', date: '', gifts: '' })
          }
        }}>
          {isAdding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="date-form">
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
            <label>Preferred Gifts (comma-separated)</label>
            <input
              type="text"
              value={formData.gifts}
              onChange={(e) => setFormData({ ...formData, gifts: e.target.value })}
              placeholder="e.g., Flowers, Chocolate, Book"
            />
          </div>
          <button type="submit" className="btn-primary">
            {editingId ? 'Update Date' : 'Add Date'}
          </button>
        </form>
      )}

      <div className="dates-list">
        {data.importantDates.length === 0 ? (
          <p className="empty-state">No important dates yet. Click + Add to add one.</p>
        ) : (
          data.importantDates
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(dateObj => {
              const notifications = getNotifications(dateObj.date)
              return (
                <div key={dateObj.id} className="date-item">
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
                    <div className="notifications">
                      <div className="notification-item">
                        <span>1 month before:</span> {notifications.monthBefore}
                      </div>
                      <div className="notification-item">
                        <span>1 week before:</span> {notifications.weekBefore}
                      </div>
                      <div className="notification-item">
                        <span>1 day before:</span> {notifications.dayBefore}
                      </div>
                      <div className="notification-item highlight">
                        <span>Day of:</span> {notifications.dayOf}
                      </div>
                    </div>
                    {dateObj.gifts && dateObj.gifts.length > 0 && (
                      <div className="gifts">
                        <span className="gifts-label">Preferred Gifts:</span>
                        <div className="gifts-list">
                          {dateObj.gifts.map((gift, i) => (
                            <span key={i} className="gift-tag">{gift}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}

export default ImportantDates

