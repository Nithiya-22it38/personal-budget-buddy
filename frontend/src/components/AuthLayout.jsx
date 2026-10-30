function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <h1> BudgetBuddy</h1>
          <p>Take control of your pocket money</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout