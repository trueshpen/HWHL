import { useState } from 'react'
import { updateData } from '../utils/storage'
import TagList from './TagList'
import './NotesView.css'

function NotesView({ data, onUpdate }) {
  const [newWishlistItem, setNewWishlistItem] = useState('')
  const [newGiftIdea, setNewGiftIdea] = useState('')
  const giftIdeas = data.giftIdeas || []

  const handleAddLike = (text) => {
    if (text.trim()) {
      const newData = updateData({
        likes: [...data.likes, { id: Date.now(), text: text.trim() }]
      })
      onUpdate(newData)
    }
  }

  const handleAddDislike = (text) => {
    if (text.trim()) {
      const newData = updateData({
        dislikes: [...data.dislikes, { id: Date.now(), text: text.trim() }]
      })
      onUpdate(newData)
    }
  }

  const handleUpdateLike = (id, text) => {
    const newData = updateData({
      likes: data.likes.map(l => l.id === id ? { ...l, text } : l)
    })
    onUpdate(newData)
  }

  const handleUpdateDislike = (id, text) => {
    const newData = updateData({
      dislikes: data.dislikes.map(d => d.id === id ? { ...d, text } : d)
    })
    onUpdate(newData)
  }

  const handleAddWishlistItem = () => {
    if (newWishlistItem.trim()) {
      const newData = updateData({
        wishlist: [...data.wishlist, { id: Date.now(), text: newWishlistItem.trim(), done: false }]
      })
      onUpdate(newData)
      setNewWishlistItem('')
    }
  }

  const handleAddGiftIdea = () => {
    if (newGiftIdea.trim()) {
      const newData = updateData({
        giftIdeas: [...giftIdeas, { id: Date.now(), text: newGiftIdea.trim(), done: false }]
      })
      onUpdate(newData)
      setNewGiftIdea('')
    }
  }

  const handleDeleteLike = (id) => {
    const newData = updateData({
      likes: data.likes.filter(l => l.id !== id)
    })
    onUpdate(newData)
  }

  const handleDeleteDislike = (id) => {
    const newData = updateData({
      dislikes: data.dislikes.filter(d => d.id !== id)
    })
    onUpdate(newData)
  }

  const handleDeleteWishlistItem = (id) => {
    const newData = updateData({
      wishlist: data.wishlist.filter(w => w.id !== id)
    })
    onUpdate(newData)
  }

  const handleToggleWishlistItem = (id) => {
    const newData = updateData({
      wishlist: data.wishlist.map(w => 
        w.id === id ? { ...w, done: !w.done } : w
      )
    })
    onUpdate(newData)
  }

  const handleToggleGiftIdea = (id) => {
    const newData = updateData({
      giftIdeas: giftIdeas.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    })
    onUpdate(newData)
  }

  const handleDeleteGiftIdea = (id) => {
    const newData = updateData({
      giftIdeas: giftIdeas.filter(item => item.id !== id)
    })
    onUpdate(newData)
  }

  return (
    <div className="notes-view">
      <div className="notes-grid">
        <div className="notes-section card">
          <div className="card-header">
            <h3>❤️ Likes</h3>
          </div>
          
          <div className="items-list">
            <TagList
              items={data.likes.map(l => ({ ...l, type: 'like' }))}
              onAdd={handleAddLike}
              onUpdate={handleUpdateLike}
              onDelete={handleDeleteLike}
              placeholder="Add like..."
              defaultType="like"
              allowTypeSelection={false}
            />
          </div>
        </div>

        <div className="notes-section card">
          <div className="card-header">
            <h3>💔 Dislikes</h3>
          </div>
          
          <div className="items-list">
            <TagList
              items={data.dislikes.map(d => ({ ...d, type: 'dislike' }))}
              onAdd={handleAddDislike}
              onUpdate={handleUpdateDislike}
              onDelete={handleDeleteDislike}
              placeholder="Add dislike..."
              defaultType="dislike"
              allowTypeSelection={false}
            />
          </div>
        </div>
      </div>

      <div className="wishlist-ideas-grid">
        <div className="notes-section card wishlist-section">
          <div className="card-header">
            <h3>🎁 Wishlist</h3>
          </div>

          <div className="add-item-form">
            <input
              type="text"
              value={newWishlistItem}
              onChange={(e) => setNewWishlistItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddWishlistItem()}
              placeholder="Add something she wants..."
              className="add-input"
            />
            <button onClick={handleAddWishlistItem} className="btn-add">Add</button>
          </div>

          <div className="wishlist-items">
            {data.wishlist.length === 0 ? (
              <p className="empty-state">Wishlist is empty. Add items above.</p>
            ) : (
              data.wishlist.map(item => (
                <div key={item.id} className={`wishlist-item ${item.done ? 'done' : ''}`}>
                  <label className="wishlist-checkbox">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleWishlistItem(item.id)}
                    />
                    <span className="checkmark"></span>
                    <span className="wishlist-text">{item.text}</span>
                  </label>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleDeleteWishlistItem(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="notes-section card gift-ideas-section">
          <div className="card-header">
            <h3>🎉 Gift & Surprise Ideas</h3>
          </div>

          <div className="add-item-form">
            <input
              type="text"
              value={newGiftIdea}
              onChange={(e) => setNewGiftIdea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddGiftIdea()}
              placeholder="Add future surprise..."
              className="add-input"
            />
            <button onClick={handleAddGiftIdea} className="btn-add">Save</button>
          </div>

          <div className="wishlist-items gift-ideas-list">
            {giftIdeas.length === 0 ? (
              <p className="empty-state">Plan a sweet surprise idea above.</p>
            ) : (
              giftIdeas.map(item => (
                <div key={item.id} className={`wishlist-item gift-idea ${item.done ? 'done' : ''}`}>
                  <label className="wishlist-checkbox">
                    <input
                      type="checkbox"
                      checked={!!item.done}
                      onChange={() => handleToggleGiftIdea(item.id)}
                    />
                    <span className="checkmark idea-checkmark"></span>
                    <span className="wishlist-text">{item.text}</span>
                  </label>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleDeleteGiftIdea(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotesView
