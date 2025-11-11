import { useState, useEffect } from 'react'
import { loadData, loadDataSync, updateData } from '../utils/storage'
import './NotesView.css'

function NotesView() {
  const [data, setData] = useState(loadDataSync())

  // Load data from server on mount (syncs with PC file)
  useEffect(() => {
    const syncData = async () => {
      const serverData = await loadData()
      setData(serverData)
    }
    syncData()
  }, [])
  const [editingLikes, setEditingLikes] = useState(false)
  const [editingDislikes, setEditingDislikes] = useState(false)
  const [newLike, setNewLike] = useState('')
  const [newDislike, setNewDislike] = useState('')
  const [newWishlistItem, setNewWishlistItem] = useState('')

  const handleAddLike = () => {
    if (newLike.trim()) {
      const newData = updateData({
        likes: [...data.likes, { id: Date.now(), text: newLike.trim() }]
      })
      setData(newData)
      setNewLike('')
    }
  }

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      const newData = updateData({
        dislikes: [...data.dislikes, { id: Date.now(), text: newDislike.trim() }]
      })
      setData(newData)
      setNewDislike('')
    }
  }

  const handleAddWishlistItem = () => {
    if (newWishlistItem.trim()) {
      const newData = updateData({
        wishlist: [...data.wishlist, { id: Date.now(), text: newWishlistItem.trim(), done: false }]
      })
      setData(newData)
      setNewWishlistItem('')
    }
  }

  const handleDeleteLike = (id) => {
    const newData = updateData({
      likes: data.likes.filter(l => l.id !== id)
    })
    setData(newData)
  }

  const handleDeleteDislike = (id) => {
    const newData = updateData({
      dislikes: data.dislikes.filter(d => d.id !== id)
    })
    setData(newData)
  }

  const handleDeleteWishlistItem = (id) => {
    const newData = updateData({
      wishlist: data.wishlist.filter(w => w.id !== id)
    })
    setData(newData)
  }

  const handleToggleWishlistItem = (id) => {
    const newData = updateData({
      wishlist: data.wishlist.map(w => 
        w.id === id ? { ...w, done: !w.done } : w
      )
    })
    setData(newData)
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

      <div className="wishlist-section card">
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
    </div>
  )
}

export default NotesView

