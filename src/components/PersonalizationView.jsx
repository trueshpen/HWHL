import React from 'react'
import CycleTracker from './CycleTracker'
import ImportantDates from './ImportantDates'
import Reminders from './Reminders'
import './PersonalizationView.css'

function PersonalizationView({ data, onUpdate }) {
  return (
    <div className="personalization-view">
      <Reminders data={data} onUpdate={onUpdate} />
      <CycleTracker data={data} onUpdate={onUpdate} />
      <ImportantDates data={data} onUpdate={onUpdate} />
    </div>
  )
}

export default PersonalizationView

