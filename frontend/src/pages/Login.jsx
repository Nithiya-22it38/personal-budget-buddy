import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../services/api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const navigate = useNavigate()

    async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const response = await api.post('/auth/login/', {
        username: username,
        password: password,
      })

      localStorage.setItem('access', response.data.access)
      localStorage.setItem('refresh', response.data.refresh)

      const me = await api.get('/auth/me/')

      if (me.data.role === 'admin') {
        navigate('/users')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.response) {
        setError('Wrong username or password.')
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }
  }

  return (
    <AuthLayout>
      <h2>Welcome back 👋</h2>
      <p className="subtitle">Log in to manage your money.</p>

      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit">Login</button>
      </form>

      <p className="switch-text">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}

export default Login