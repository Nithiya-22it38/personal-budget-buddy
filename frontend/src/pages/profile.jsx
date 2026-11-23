import { useEffect, useState } from 'react'
import api from '../services/api'

function Profile() {
  const [user, setUser] = useState(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [alertPercent, setAlertPercent] = useState('80')
  const [emailChoice, setEmailChoice] = useState('yes')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadProfile() {
    const response = await api.get('/profile/')
    setFullName(response.data.full_name)
    setPhone(response.data.phone)
    setCollege(response.data.college)
    setMonthlyIncome(response.data.monthly_income)
    setAlertPercent(response.data.budget_alert_percent)

    if (response.data.email_notifications) {
      setEmailChoice('yes')
    } else {
      setEmailChoice('no')
    }
  }

  useEffect(() => {
    async function loadData() {
      const me = await api.get('/auth/me/')
      setUser(me.data)
      await loadProfile()
    }
    loadData()
  }, [])

  function startEditing() {
    setMessage('')
    setError('')
    setEditing(true)
  }

  async function cancelEditing() {
    setError('')
    setEditing(false)
    await loadProfile()
  }

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    let income = monthlyIncome
    if (income === '') {
      income = 0
    }

    try {
      await api.put('/profile/', {
        full_name: fullName,
        phone: phone,
        college: college,
        monthly_income: income,
        budget_alert_percent: Number(alertPercent),
        email_notifications: emailChoice === 'yes',
      })

      setMessage('Your profile was saved.')
      setEditing(false)
    } catch (err) {
      if (err.response) {
        const errors = err.response.data
        if (errors.phone) {
          setError('Phone: ' + errors.phone[0])
        } else if (errors.monthly_income) {
          setError('Monthly income: ' + errors.monthly_income[0])
        } else if (errors.budget_alert_percent) {
          setError('Budget alert level: ' + errors.budget_alert_percent[0])
        } else if (errors.full_name) {
          setError('Full name: ' + errors.full_name[0])
        } else if (errors.college) {
          setError('College: ' + errors.college[0])
        } else {
          setError('Could not save your profile.')
        }
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }

    setSaving(false)
  }

  let displayName = ''
  if (fullName !== '') {
    displayName = fullName
  } else if (user !== null) {
    displayName = user.username
  }

  let firstLetter = '?'
  if (displayName !== '') {
    firstLetter = displayName.charAt(0).toUpperCase()
  }

  return (
    <div className="profile-page">
      <h1 className="page-title">Profile</h1>

      <div className="profile-header">
        <div className="avatar">{firstLetter}</div>
        <div>
          <p className="profile-name">{displayName}</p>
          {user && <p className="profile-sub">{user.email}</p>}
          {user && <span className="badge badge-active role-badge">{user.role}</span>}
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="section">
          <h3>Personal details</h3>
          <div className="expense-form">
            <div>
              <label>Full name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editing}
              />
            </div>

            <div>
              <label>Phone</label>
              <input
                type="text"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
              />
            </div>

            <div>
              <label>College</label>
              <input
                type="text"
                placeholder="Your college name"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                disabled={!editing}
              />
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Money</h3>
          <div className="expense-form">
            <div>
              <label>Monthly income (pocket money)</label>
              <input
                type="number"
                step="0.01"
                placeholder="5000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                disabled={!editing}
              />
            </div>

            <div>
              <label>Budget alert level (%)</label>
              <input
                type="number"
                placeholder="80"
                value={alertPercent}
                onChange={(e) => setAlertPercent(e.target.value)}
                disabled={!editing}
              />
            </div>
          </div>
          <p className="muted hint">
            You get a warning when a budget is this much used. For example, 80 warns you at 80% of the limit.
          </p>
        </div>

        <div className="section">
          <h3>Preferences</h3>
          <div className="expense-form">
            <div>
              <label>Email notifications</label>
              <select
                value={emailChoice}
                onChange={(e) => setEmailChoice(e.target.value)}
                disabled={!editing}
              >
                <option value="yes">Yes, send me emails</option>
                <option value="no">No, do not send emails</option>
              </select>
            </div>
          </div>
          <p className="muted hint">
            Budget alerts, goal updates and report messages are also sent to your email address.
          </p>
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        {!editing && (
          <button className="btn btn-small" type="button" onClick={startEditing}>
            Edit profile
          </button>
        )}

        {editing && (
          <div>
            <button className="btn btn-small" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button className="btn-cancel" type="button" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default Profile