import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import api from '../services/api'

const menu = [
  { to: '/dashboard', label: 'Dashboard', roles: ['student', 'premium', 'admin'] },
  { to: '/transactions', label: 'Transactions', roles: ['student', 'premium', 'admin'] },
  { to: '/expenses', label: 'Expenses', roles: ['student', 'premium', 'admin'] },
  { to: '/incomes', label: 'Income', roles: ['student', 'premium', 'admin'] },
  { to: '/budgets', label: 'Budgets', roles: ['student', 'premium', 'admin'] },
  { to: '/categories', label: 'Categories', roles: ['student', 'premium', 'admin'] },
  { to: '/profile', label: 'Profile', roles: ['student', 'premium', 'admin'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
]

function Layout() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await api.get('/auth/me/')
        setUser(response.data)
      } catch (err) {
        logout()
      }
    }
    loadUser()
  }, [])

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  let visibleMenu = []
  if (user) {
    visibleMenu = menu.filter((item) => item.roles.includes(user.role))
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="sidebar-brand">BudgetBuddy</h2>

        <nav>
          {visibleMenu.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <p className="sidebar-user">
            {user.username}
            <br />
            <span>{user.role}</span>
          </p>
        )}
        <button className="logout-btn" onClick={logout}>Logout</button>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout