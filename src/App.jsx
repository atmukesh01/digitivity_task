import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="container">
      <h1>Digitivity Task</h1>
      <div className="card">
        <p>The current count is: <strong>{count}</strong></p>
        <button onClick={() => setCount(count + 1)}>
          Increment
        </button>
        <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>
          Reset
        </button>
      </div>
    </div>
  )
}

export default App