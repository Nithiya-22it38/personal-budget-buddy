import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Expenses from './pages/Expenses'
import Incomes from './pages/Incomes'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Notifications from './pages/Notifications'
import Categories from './pages/Categories'
import Profile from './pages/Profile'
import Users from './pages/Users'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import RoleRoute from './components/RoleRoute'
import Layout from './components/Layout'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/incomes" element={<Incomes />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <Users />
              </RoleRoute>
          
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App