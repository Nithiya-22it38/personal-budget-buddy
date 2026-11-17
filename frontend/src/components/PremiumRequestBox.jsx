import { useEffect, useState } from 'react'
import api from '../services/api'

function PremiumRequestBox() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function loadStatus() {
    try {
      const response = await api.get('/auth/premium-request/')
      setStatus(response.data.status)
    } catch (err) {
      setStatus('none')
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function handleRequest() {
    setMessage('')
    setError('')
    setSending(true)

    try {
      await api.post('/auth/premium-request/')
      setStatus('pending')
      setMessage('Your request was sent to the admins.')
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Could not send the request. Please try again.')
      }
    }

    setSending(false)
  }

  if (status === 'loading') {
    return <p className="muted">Loading...</p>
  }

  return (
    <div>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      {status === 'pending' && (
        <p className="muted">
          Your premium request is waiting for an admin. You will get a notification when it is decided.
        </p>
      )}

      {status === 'declined' && (
        <p className="muted">
          Your last request was declined. You can send a new one.
        </p>
      )}

      {status !== 'pending' && (
        <button className="btn btn-small" type="button" onClick={handleRequest} disabled={sending}>
          {sending ? 'Sending...' : 'Request premium'}
        </button>
      )}
    </div>
  )
}

export default PremiumRequestBox