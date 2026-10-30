import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../services/api'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')

    try {
      await api.post('/auth/register/', {
        username: username,
        email: email,
        password: password,
      })
      navigate('/login')
    } catch (err) {
      if (err.response) {
        const data = err.response.data
        if (data.username) {
          setError(data.username[0])
        } else if (data.email) {
          setError(data.email[0])
        } else if (data.password) {
          setError(data.password[0])
        } else {
          setError('Something went wrong. Please try again.')
        }
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }
  }

  return (
    <AuthLayout>
      <h2>Create your account 🚀</h2>
      <p className="subtitle">Start tracking your money in a minute.</p>

      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>Confirm password</label>
        <input
          type="password"
          placeholder="Type the password again"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <p className="muted role-note">
          New accounts start as Student. An admin can change roles later.
        </p>

        <button className="btn" type="submit">
          Register
        </button>
      </form>

      <p className="switch-text">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  )
}

export default Register
