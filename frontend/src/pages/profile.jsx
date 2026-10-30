import { useEffect, useState } from 'react'
import api from '../services/api'

function Profile() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const response = await api.get('/profile/')
      setFullName(response.data.full_name)
      setPhone(response.data.phone)
      setCollege(response.data.college)
      setMonthlyIncome(response.data.monthly_income)
    }
    loadProfile()
  }, [])

  async function handleSave(event) {
    event.preventDefault()
    setMessage('')
    setError('')

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
      })
      setMessage('Profile saved.')
    } catch (err) {
      setError('Could not save. Check that the income is a number.')
    }
  }

  return (
    <div>
      <h1 className="page-title">Profile</h1>

      <div className="section profile-box">
        <form onSubmit={handleSave}>
          <label>Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <label>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label>College</label>
          <input
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />

          <label>Monthly income (pocket money)</label>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
          />

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}

          <button className="btn" type="submit">Save profile</button>
        </form>
      </div>
    </div>
  )
}

export default Profile