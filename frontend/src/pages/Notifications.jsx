import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../services/api'

const typeNames = {
  budget_alert: 'Budget alert',
  overspending: 'Overspending',
  savings_reminder: 'Savings reminder',
  goal_milestone: 'Goal milestone',
  monthly_report: 'Monthly report',
}

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const context = useOutletContext()

  async function loadNotifications() {
    const response = await api.get('/notifications/')
    setNotifications(response.data)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  async function markRead(id) {
    await api.put('/notifications/' + id + '/read/')
    loadNotifications()
    context.refreshUnread()
  }

  async function markAllRead() {
    await api.post('/notifications/read-all/')
    loadNotifications()
    context.refreshUnread()
  }

  let unreadCount = 0
  const shown = []

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i]

    if (!n.is_read) {
      unreadCount = unreadCount + 1
    }

    if (filter === 'all' || !n.is_read) {
      shown.push(n)
    }
  }

  return (
    <div>
      <h1 className="page-title">Notifications</h1>

      <div className="cards">
        <div className="card">
          <p className="card-label">Unread</p>
          <p className="card-value">{unreadCount}</p>
        </div>
        <div className="card">
          <p className="card-label">Total</p>
          <p className="card-value">{notifications.length}</p>
        </div>
      </div>

      <div className="section">
        <div className="month-row">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
          </select>

          {unreadCount > 0 && (
            <button className="btn btn-small" type="button" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {shown.length === 0 && (
          <p className="muted">Nothing to show. Alerts appear here when something important happens.</p>
        )}

        {shown.map((n) => (
          <div
            className={n.is_read ? 'notification-item' : 'notification-item unread'}
            key={n.id}
          >
            <div className="notification-top">
              <b>{n.title}</b>
              <span className="notification-type">{typeNames[n.notification_type]}</span>
            </div>

            <p className="notification-message">{n.message}</p>

            <span className="notification-time">
              {new Date(n.created_at).toLocaleString()}
            </span>

            {!n.is_read && (
              <button className="btn-edit" onClick={() => markRead(n.id)}>
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Notifications