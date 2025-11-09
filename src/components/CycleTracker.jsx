import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { loadData, updateData } from '../utils/storage'
import './CycleTracker.css'

function CycleTracker({ data, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    startDate: data.cycle.startDate || '',
    endDate: data.cycle.endDate || '',
    cycleLength: data.cycle.cycleLength || 28,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const cycleData = {
      ...formData,
      expectedNextStart: formData.startDate 
        ? format(addDays(new Date(formData.startDate), formData.cycleLength), 'yyyy-MM-dd')
        : null,
    }
    
    const newData = updateData({
      cycle: {
        ...data.cycle,
        ...cycleData,
      }
    })
    onUpdate(newData)
    setIsEditing(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="cycle-tracker card">
      <div className="card-header">
        <h3>🔄 Cycle Tracking</h3>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="cycle-form">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Cycle Length (days)</label>
            <input
              type="number"
              name="cycleLength"
              value={formData.cycleLength}
              onChange={handleChange}
              min="21"
              max="35"
            />
          </div>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      ) : (
        <div className="cycle-info">
          {data.cycle.startDate ? (
            <>
              <div className="info-item">
                <span className="label">Last Start:</span>
                <span>{format(new Date(data.cycle.startDate), 'MMM d, yyyy')}</span>
              </div>
              {data.cycle.endDate && (
                <div className="info-item">
                  <span className="label">Last End:</span>
                  <span>{format(new Date(data.cycle.endDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {data.cycle.expectedNextStart && (
                <>
                  <div className="info-item">
                    <span className="label">Expected Next:</span>
                    <span className="highlight">
                      {format(new Date(data.cycle.expectedNextStart), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="info-item notification">
                    <span className="label">8 Days Before:</span>
                    <span>
                      {format(addDays(new Date(data.cycle.expectedNextStart), -8), 'MMM d, yyyy')}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="empty-state">No cycle data yet. Click Edit to add.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default CycleTracker

