import { useState } from 'react'
import { format } from 'date-fns'
import { updateData } from '../utils/storage'
import { PHASES, MAX_CYCLE_LENGTH_DAYS } from '../utils/constants'
import { getCycleDay } from '../utils/cycleUtils'
import './CycleTracker.css'

function CycleTracker({ data, onUpdate }) {
  const periods = data.cycle.periods || []
  const [editingPhase, setEditingPhase] = useState(null)
  const [newItemText, setNewItemText] = useState('')
  const [newItemType, setNewItemType] = useState('do')
  const [selectedPhaseForAdd, setSelectedPhaseForAdd] = useState('pre-period')
  
  // Calculate how many cycles were actually used for average calculation
  const getCyclesUsedForAvg = () => {
    if (!periods || periods.length < 2) return 0
    const sorted = [...periods].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    )
    
    let validCycles = 0
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.round(
        (new Date(sorted[i].startDate) - new Date(sorted[i-1].startDate)) / (1000 * 60 * 60 * 24)
      )
      if (days > 0 && days < MAX_CYCLE_LENGTH_DAYS) {
        validCycles++
      }
    }
    return validCycles
  }

  const cyclesUsedForAvg = getCyclesUsedForAvg()

  // Calculate current cycle day using shared utility
  const getCurrentCycleDay = () => {
    return getCycleDay(new Date(), data.cycle)
  }

  // Get current phase based on cycle day
  const getCurrentPhase = () => {
    const cycleDay = getCurrentCycleDay()
    if (!cycleDay) return null
    
    for (const [phaseKey, phase] of Object.entries(PHASES)) {
      if (phase.days.includes(cycleDay)) {
        return phaseKey
      }
    }
    
    // If cycle day is beyond 28, treat it as pre-period
    if (cycleDay > 28) {
      return 'pre-period'
    }
    
    return null
  }

  const currentPhase = getCurrentCycleDay() ? getCurrentPhase() : null
  const suggestions = data.cycle.suggestions || {}

  // Initialize suggestions if not present
  const getPhaseData = (phaseKey) => {
    if (!suggestions[phaseKey]) {
      const phase = PHASES[phaseKey]
      return {
        phase: phase ? phase.name : phaseKey,
        items: []
      }
    }
    return suggestions[phaseKey]
  }

  const handleAddItem = (phaseKey) => {
    if (!newItemText.trim()) return
    
    const phaseData = getPhaseData(phaseKey)
    const newItem = {
      type: newItemType,
      text: newItemText.trim(),
      id: `item-${Date.now()}-${Math.random()}`
    }
    
    const newData = updateData({
      cycle: {
        ...data.cycle,
        suggestions: {
          ...suggestions,
          [phaseKey]: {
            ...phaseData,
            items: [...phaseData.items, newItem]
          }
        }
      }
    })
    onUpdate(newData)
    setNewItemText('')
    setNewItemType('do')
  }

  const handleRemoveItem = (phaseKey, itemId) => {
    const phaseData = getPhaseData(phaseKey)
    const newData = updateData({
      cycle: {
        ...data.cycle,
        suggestions: {
          ...suggestions,
          [phaseKey]: {
            ...phaseData,
            items: phaseData.items.filter(item => item.id !== itemId)
          }
        }
      }
    })
    onUpdate(newData)
  }

  const handleUpdateItemText = (phaseKey, itemId, newText) => {
    const phaseData = getPhaseData(phaseKey)
    const newData = updateData({
      cycle: {
        ...data.cycle,
        suggestions: {
          ...suggestions,
          [phaseKey]: {
            ...phaseData,
            items: phaseData.items.map(item => 
              item.id === itemId ? { ...item, text: newText } : item
            )
          }
        }
      }
    })
    onUpdate(newData)
  }

  return (
    <div className="cycle-tracker card">
      <div className="card-header">
        <h3>🔄 Cycle</h3>
      </div>
      <div className="cycle-hint">
        <p>💡 Click on calendar days to mark period Start or End</p>
      </div>

      <div className="cycle-info">
        {periods.length > 0 ? (
          <>
            {data.cycle.expectedNextStart && (
              <div className="info-item">
                <span className="label">Expected Next Start:</span>
                <span className="highlight">
                  {format(new Date(data.cycle.expectedNextStart), 'd MMM yyyy')}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Average Cycle Length:</span>
              <span>{data.cycle.cycleLength || 28} days</span>
              {cyclesUsedForAvg > 0 && (
                <span className="cycle-count"> (from {cyclesUsedForAvg} cycle{cyclesUsedForAvg !== 1 ? 's' : ''})</span>
              )}
            </div>
            {getCurrentCycleDay() && (
              <div className="info-item">
                <span className="label">Current Cycle Day:</span>
                <span className="highlight">Day {getCurrentCycleDay()}</span>
              </div>
            )}
            {currentPhase && (() => {
              const phaseData = getPhaseData(currentPhase)
              const isEditing = editingPhase === 'all' || editingPhase === currentPhase
              return (
                <div className="current-phase-section">
                  <div className="current-phase-header">
                    <div className="current-phase-title">
                      <span className="phase-emoji">{PHASES[currentPhase].emoji}</span>
                      <span className="phase-name">{PHASES[currentPhase].name}</span>
                    </div>
                    <button 
                      onClick={() => setEditingPhase(editingPhase ? null : 'all')}
                      className="edit-phase-btn"
                    >
                      {editingPhase ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  <div className="current-phase-suggestions">
                    {phaseData.items.length > 0 ? (
                      phaseData.items.map(item => (
                        <div key={item.id} className={`suggestion-item ${item.type}`}>
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={item.text}
                                onChange={(e) => handleUpdateItemText(currentPhase, item.id, e.target.value)}
                                className="suggestion-input"
                              />
                              <button
                                onClick={() => handleRemoveItem(currentPhase, item.id)}
                                className="remove-item-btn"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="suggestion-icon">
                                {item.type === 'do' ? '✓' : '×'}
                              </span>
                              <span className="suggestion-text">{item.text}</span>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      !isEditing && (
                        <div className="no-suggestions">No suggestions yet</div>
                      )
                    )}
                  </div>
                </div>
              )
            })()}
          </>
        ) : (
          <p className="empty-state">
            No period data yet. Click on a calendar day to mark it as Start or End.
          </p>
        )}
      </div>

      {/* Add suggestion form (shown when editing) */}
      {editingPhase && (
        <div className="add-suggestion-global">
          <div className="add-suggestion-form">
            <label>Add suggestion for:</label>
            <select
              value={selectedPhaseForAdd}
              onChange={(e) => setSelectedPhaseForAdd(e.target.value)}
              className="suggestion-phase-select"
            >
              {Object.entries(PHASES).map(([key, phase]) => (
                <option key={key} value={key}>
                  {phase.emoji} {phase.name}
                </option>
              ))}
            </select>
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              className="suggestion-type-select"
            >
              <option value="do">✓ To Do</option>
              <option value="dont">× Not To Do</option>
            </select>
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem(selectedPhaseForAdd)
                }
              }}
              placeholder="Add suggestion..."
              className="suggestion-input"
            />
            <button
              onClick={() => handleAddItem(selectedPhaseForAdd)}
              className="add-item-btn"
            >
              Add
            </button>
          </div>
          {/* Show existing suggestions for selected phase */}
          {(() => {
            const selectedPhaseData = getPhaseData(selectedPhaseForAdd)
            return selectedPhaseData.items.length > 0 && (
              <div className="selected-phase-suggestions">
                <div className="selected-phase-title">
                  Existing suggestions for {PHASES[selectedPhaseForAdd].emoji} {PHASES[selectedPhaseForAdd].name}:
                </div>
                <div className="suggestions-list">
                  {selectedPhaseData.items.map(item => (
                    <div key={item.id} className={`suggestion-item ${item.type}`}>
                      <span className="suggestion-icon">
                        {item.type === 'do' ? '✓' : '×'}
                      </span>
                      <span className="suggestion-text">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default CycleTracker
