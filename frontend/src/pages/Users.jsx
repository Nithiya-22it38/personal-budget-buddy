import { useEffect, useState } from 'react'
import api from '../services/api'

function Users() {
  const [users, setUsers] = useState([])
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

  useEffect(() => {
    loadUsers()
  }, [])

  async function changeRole(userId, newRole) {
    setMessage('')
    setError('')

    try {
      await api.put('/auth/users/' + userId + '/role/', { role: newRole })
      setMessage('Role updated.')
      loadUsers()
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Could not change the role.')
      }
    }
  }

  return (
    <div>
      <h1 className="page-title">Users</h1>

      <div className="section">
        <p className="muted">Only admins can see this page. Change a user's role from the list.</p>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
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