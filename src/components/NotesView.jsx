import { useState } from 'react'
import { updateData } from '../utils/storage'
import './NotesView.css'

function NotesView({ data, onUpdate }) {
  const [editingLikes, setEditingLikes] = useState(false)
  const [editingDislikes, setEditingDislikes] = useState(false)
  const [newLike, setNewLike] = useState('')
  const [newDislike, setNewDislike] = useState('')
  const [newWishlistItem, setNewWishlistItem] = useState('')
  const [newGiftIdea, setNewGiftIdea] = useState('')
  const giftIdeas = data.giftIdeas || []

  const handleAddLike = () => {
    if (newLike.trim()) {
      const newData = updateData({
        likes: [...data.likes, { id: Date.now(), text: newLike.trim() }]
      })
      onUpdate(newData)
      setNewLike('')
    }
  }

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      const newData = updateData({
        dislikes: [...data.dislikes, { id: Date.now(), text: newDislike.trim() }]
      })
      onUpdate(newData)
      setNewDislike('')
    }
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
            <button onClick={() => setEditingLikes(!editingLikes)}>
              {editingLikes ? 'Done' : 'Edit'}
            </button>
          </div>
          
          {editingLikes && (
            <div className="add-item-form">
              <input
                type="text"
                value={newLike}
                onChange={(e) => setNewLike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLike()}
                placeholder="Add something she likes..."
                className="add-input"
              />
              <button onClick={handleAddLike} className="btn-add">Add</button>
            </div>
          )}

          <div className="items-list">
            {data.likes.length === 0 ? (
              <p className="empty-state">No likes added yet. Click Edit to add.</p>
            ) : (
              data.likes.map(like => (
                <div key={like.id} className="item">
                  <span>{like.text}</span>
                  {editingLikes && (
                    <button
                      className="delete-item-btn"
                      onClick={() => handleDeleteLike(like.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="notes-section card">
          <div className="card-header">
            <h3>💔 Dislikes</h3>
            <button onClick={() => setEditingDislikes(!editingDislikes)}>
              {editingDislikes ? 'Done' : 'Edit'}
            </button>
          </div>
          
          {editingDislikes && (
            <div className="add-item-form">
              <input
                type="text"
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDislike()}
                placeholder="Add something she dislikes..."
                className="add-input"
              />
              <button onClick={handleAddDislike} className="btn-add">Add</button>
            </div>
          )}

          <div className="items-list">
            {data.dislikes.length === 0 ? (
              <p className="empty-state">No dislikes added yet. Click Edit to add.</p>
            ) : (
              data.dislikes.map(dislike => (
                <div key={dislike.id} className="item">
                  <span>{dislike.text}</span>
                  {editingDislikes && (
                    <button
                      className="delete-item-btn"
                      onClick={() => handleDeleteDislike(dislike.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
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
