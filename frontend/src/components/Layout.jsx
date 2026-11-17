import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'

const menu = [
  { to: '/dashboard', label: 'Dashboard', roles: ['student', 'premium', 'admin'] },
  { to: '/transactions', label: 'Transactions', roles: ['student', 'premium', 'admin'] },
  { to: '/expenses', label: 'Expenses', roles: ['student', 'premium', 'admin'] },
  { to: '/incomes', label: 'Income', roles: ['student', 'premium', 'admin'] },
  { to: '/budgets', label: 'Budgets', roles: ['student', 'premium', 'admin'] },
  { to: '/goals', label: 'Savings Goals', roles: ['student', 'premium', 'admin'] },
  { to: '/notifications', label: 'Notifications', roles: ['student', 'premium', 'admin'] },
  { to: '/reports', label: 'Reports', roles: ['student', 'premium', 'admin'] },
  { to: '/categories', label: 'Categories', roles: ['student', 'premium', 'admin'] },
  { to: '/profile', label: 'Profile', roles: ['student', 'premium', 'admin'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
  { to: '/analytics', label: 'Analytics', roles: ['student', 'premium', 'admin'] },
]

function Layout() {
  const [user, setUser] = useState(null)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

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

  async function loadUnread() {
    try {
      const response = await api.get('/notifications/unread-count/')
      setUnread(response.data.unread_count)
    } catch (err) {
      setUnread(0)
    }
  }

  // runs again every time the student opens another page
  useEffect(() => {
    loadUnread()
  }, [location.pathname])

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  // keep only the menu items this user's role is allowed to see
  let visibleMenu = []
  if (user) {
    for (let i = 0; i < menu.length; i++) {
      if (menu[i].roles.includes(user.role)) {
        visibleMenu.push(menu[i])
      }
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="sidebar-brand">BudgetBuddy</h2>

        <nav>
          {visibleMenu.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
              {item.to === '/notifications' && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
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
        <Outlet context={{ refreshUnread: loadUnread }} />
      </main>
    </div>
  )
}

export default Layout