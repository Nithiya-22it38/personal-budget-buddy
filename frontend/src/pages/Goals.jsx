import { useEffect, useState } from 'react'
import api from '../services/api'
import ProgressBar from '../components/ProgressBar'

function Goals() {
  const [goals, setGoals] = useState([])

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [moneyGoalId, setMoneyGoalId] = useState(null)
  const [moneyAmount, setMoneyAmount] = useState('')

  const [historyGoalId, setHistoryGoalId] = useState(null)
  const [history, setHistory] = useState([])

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadGoals() {
    const response = await api.get('/goals/')
    setGoals(response.data)
  }

  useEffect(() => {
    loadGoals()
  }, [])

  function clearForm() {
    setName('')
    setTarget('')
    setDeadline('')
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    let deadlineValue = null
    if (deadline !== '') {
      deadlineValue = deadline
    }

    const data = {
      name: name,
      target_amount: target,
      deadline: deadlineValue,
    }

    try {
      if (editingId === null) {
        await api.post('/goals/', data)
        setMessage('Goal created.')
      } else {
        await api.put('/goals/' + editingId + '/', data)
        setMessage('Goal updated.')
      }
      clearForm()
      loadGoals()
    } catch (err) {
      if (err.response) {
        const errors = err.response.data
        if (errors.name) {
          setError('Name: ' + errors.name[0])
        } else if (errors.target_amount) {
          setError(errors.target_amount[0])
        } else if (errors.deadline) {
          setError(errors.deadline[0])
        } else {
          setError('Could not save the goal.')
        }
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }
  }

  function startEdit(goal) {
    setEditingId(goal.id)
    setName(goal.name)
    setTarget(goal.target_amount)
    if (goal.deadline === null) {
      setDeadline('')
    } else {
      setDeadline(goal.deadline)
    }
    setMessage('')
    setError('')
  }

  async function handleDelete(id) {
    const sure = window.confirm('Delete this goal and its history?')
    if (!sure) {
      return
    }

    await api.delete('/goals/' + id + '/')
    setMessage('Goal deleted.')
    loadGoals()
  }

  function openMoneyBox(id) {
    setMoneyGoalId(id)
    setMoneyAmount('')
    setMessage('')
    setError('')
  }

  async function handleAddMoney(event, id) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await api.post('/goals/' + id + '/money/', { amount: moneyAmount })

      if (response.data.status === 'completed') {
        setMessage('Goal completed. Congratulations!')
      } else {
        setMessage('Money added.')
      }

      setMoneyGoalId(null)
      setMoneyAmount('')
      loadGoals()

      if (historyGoalId === id) {
        loadHistory(id)
      }
    } catch (err) {
      if (err.response && err.response.data.amount) {
        setError(err.response.data.amount[0])
      } else if (err.response && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Could not add the money.')
      }
    }
  }

  async function loadHistory(id) {
    const response = await api.get('/goals/' + id + '/money/')
    setHistory(response.data)
  }

  async function toggleHistory(id) {
    if (historyGoalId === id) {
      setHistoryGoalId(null)
      return
    }
    await loadHistory(id)
    setHistoryGoalId(id)
  }

  let activeCount = 0
  let completedCount = 0
  for (let i = 0; i < goals.length; i++) {
    if (goals[i].status === 'completed') {
      completedCount = completedCount + 1
    } else {
      activeCount = activeCount + 1
    }
  }

  return (
    <div>
      <h1 className="page-title">Savings Goals</h1>

      <div className="cards">
        <div className="card">
          <p className="card-label">Active Goals</p>
          <p className="card-value">{activeCount}</p>
        </div>
        <div className="card">
          <p className="card-label">Completed Goals</p>
          <p className="card-value">{completedCount}</p>
        </div>
      </div>

      <div className="section">
        <h3>{editingId === null ? 'Create a goal' : 'Edit goal'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="expense-form">
            <div>
              <label>Goal name</label>
              <input
                type="text"
                placeholder="New Laptop Fund"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label>Target amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="60000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>

            <div>
              <label>Deadline (optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}

          <button className="btn btn-small" type="submit">
            {editingId === null ? 'Create goal' : 'Save changes'}
          </button>
          {editingId !== null && (
            <button className="btn-cancel" type="button" onClick={clearForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="section list-section">
        <h3>Your goals</h3>

        {goals.length === 0 && (
          <p className="muted">No goals yet. Create your first one above.</p>
        )}

        {goals.map((g) => (
          <div className="goal-card" key={g.id}>
            <div className="budget-top">
              <b>{g.name}</b>
              <span className={g.status === 'completed' ? 'badge badge-done' : 'badge badge-active'}>
                {g.status === 'completed' ? 'Completed' : 'Active'}
              </span>
            </div>

            <div className="budget-top">
              <span>{'₹' + g.saved_amount.toFixed(2) + ' of ₹' + g.target_amount.toFixed(2)}</span>
              <span>{g.percent_saved + '% saved'}</span>
            </div>

            <ProgressBar
              percent={g.percent_saved}
              status={g.status === 'completed' ? 'done' : 'ok'}
            />

            <div className="budget-bottom">
              <span>{'₹' + g.remaining.toFixed(2) + ' to go'}</span>
              <span>{g.deadline === null ? 'No deadline' : 'Deadline: ' + g.deadline}</span>
            </div>

            <div>
              {g.status === 'active' && (
                <button className="btn-edit" onClick={() => openMoneyBox(g.id)}>
                  Add money
                </button>
              )}
              <button className="btn-edit" onClick={() => toggleHistory(g.id)}>
                {historyGoalId === g.id ? 'Hide history' : 'History'}
              </button>
              <button className="btn-edit" onClick={() => startEdit(g)}>
                Edit
              </button>
              <button className="btn-delete" onClick={() => handleDelete(g.id)}>
                Delete
              </button>
            </div>

            {moneyGoalId === g.id && (
              <form className="money-form" onSubmit={(e) => handleAddMoney(e, g.id)}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount to add"
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                />
                <button className="btn btn-small" type="submit">Add</button>
                <button className="btn-cancel" type="button" onClick={() => setMoneyGoalId(null)}>
                  Cancel
                </button>
              </form>
            )}

            {historyGoalId === g.id && (
              <div className="history-box">
                {history.length === 0 && <p className="muted">No money added yet.</p>}
                {history.map((h) => (
                  <div className="history-row" key={h.id}>
                    <span>{h.date}</span>
                    <span>{'+₹' + h.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Goals