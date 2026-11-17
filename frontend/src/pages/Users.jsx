import { useEffect, useState } from 'react'
import api from '../services/api'

function Users() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadUsers() {
    try {
      const response = await api.get('/auth/users/')
      setUsers(response.data)
    } catch (err) {
      setError('Could not load the users.')
    }
  }

  async function loadStats() {
    try {
      const response = await api.get('/auth/users/stats/')
      setStats(response.data)
    } catch (err) {
      setStats(null)
    }
  }

  async function loadRequests() {
    try {
      const response = await api.get('/auth/premium-requests/')
      setRequests(response.data)
    } catch (err) {
      setRequests([])
    }
  }

  useEffect(() => {
    loadUsers()
    loadStats()
    loadRequests()
  }, [])

  async function changeRole(userId, newRole) {
    setMessage('')
    setError('')

    try {
      await api.put('/auth/users/' + userId + '/role/', { role: newRole })
      setMessage('Role updated. The user has been notified.')
      loadUsers()
      loadStats()
      loadRequests()
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Could not change the role.')
      }
    }
  }

  async function handleDecision(requestId, decision) {
    setMessage('')
    setError('')

    try {
      await api.put('/auth/premium-requests/' + requestId + '/', { decision: decision })

      if (decision === 'approve') {
        setMessage('Request approved. The user is now premium and has been notified.')
      } else {
        setMessage('Request declined. The user has been notified.')
      }

      loadUsers()
      loadStats()
      loadRequests()
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Could not handle the request.')
      }
    }
  }

  return (
    <div>
      <h1 className="page-title">Users</h1>

      {stats && (
        <div className="cards">
          <div className="card">
            <p className="card-label">Total users</p>
            <p className="card-value">{stats.total}</p>
          </div>
          <div className="card">
            <p className="card-label">Students</p>
            <p className="card-value">{stats.students}</p>
          </div>
          <div className="card">
            <p className="card-label">Premium</p>
            <p className="card-value">{stats.premium}</p>
          </div>
          <div className="card">
            <p className="card-label">Admins</p>
            <p className="card-value">{stats.admins}</p>
          </div>
          <div className="card">
            <p className="card-label">New this week</p>
            <p className="card-value">{stats.new_this_week}</p>
          </div>
        </div>
      )}

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="section">
        <h3>{'Premium requests (' + requests.length + ')'}</h3>

        {requests.length === 0 && (
          <p className="muted">No pending requests.</p>
        )}

        {requests.map((r) => (
          <div className="budget-item" key={r.id}>
            <div className="budget-top">
              <b>{r.username}</b>
              <span>{new Date(r.requested_at).toLocaleString()}</span>
            </div>
            <p className="muted">{r.email}</p>
            <button className="btn-edit" onClick={() => handleDecision(r.id, 'approve')}>
              Approve
            </button>
            <button className="btn-delete" onClick={() => handleDecision(r.id, 'decline')}>
              Decline
            </button>
          </div>
        ))}
      </div>

      <div className="section list-section">
        <h3>All users</h3>
        <p className="muted">Only admins can see this page. Change a user's role from the list.</p>

        <div className="table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users