import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../services/api'

function RoleRoute({ allowedRoles, children }) {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkRole() {
      try {
        const response = await api.get('/auth/me/')
        setRole(response.data.role)
      } catch (err) {
        setRole(null)
      }
      setLoading(false)
    }
    checkRole()
  }, [])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" />
  }

  return children
}

export default RoleRoute