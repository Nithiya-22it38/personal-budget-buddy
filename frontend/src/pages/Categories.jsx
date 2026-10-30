import { useEffect, useState } from 'react'
import api from '../services/api'

function Categories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function loadCategories() {
    const response = await api.get('/categories/')
    setCategories(response.data)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function handleAdd(event) {
    event.preventDefault()
    setError('')

    try {
      await api.post('/categories/', { name: name })
      setName('')
      loadCategories()
    } catch (err) {
      setError('Could not add the category. Please enter a name.')
    }
  }

  return (
    <div>
      <h1 className="page-title">Categories</h1>

      <div className="section">
        <h3>Add your own category</h3>
        <form className="category-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Category name, for example Gym"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-small" type="submit">Add</button>
        </form>
        {error && <div className="error">{error}</div>}

        <h3>All categories</h3>
        {categories.map((c) => (
          <div className="category-row" key={c.id}>
            {c.name}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Categories