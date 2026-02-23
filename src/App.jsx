import './App.css';
import { useMemo, useState } from 'react';

function App() {
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: '' });
  const [expenses, setExpenses] = useState([]);

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.amount || !form.date) {
      return;
    }

    const nextExpense = {
      id: Date.now(),
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    };

    setExpenses((prev) => [nextExpense, ...prev]);
    setForm({ title: '', amount: '', category: 'Food', date: '' });
  };

  const handleDelete = (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className="app">
      <section className="card">
        <h1 className="title">Expense Tracker</h1>
        <p className="subtitle">Track your daily spending with a simple frontend.</p>

        <form className="expense-form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder="Expense title"
            aria-label="Expense title"
          />
          <input
            className="input"
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleInputChange}
            placeholder="Amount"
            min="0"
            step="0.01"
            aria-label="Expense amount"
          />
          <select
            className="input"
            name="category"
            value={form.category}
            onChange={handleInputChange}
            aria-label="Expense category"
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Other">Other</option>
          </select>
          <input
            className="input"
            type="date"
            name="date"
            value={form.date}
            onChange={handleInputChange}
            aria-label="Expense date"
          />
          <button className="btn" type="submit">
            Add Expense
          </button>
        </form>

        <div className="summary">
          <span>Total Expenses</span>
          <strong>${total.toFixed(2)}</strong>
        </div>

        <ul className="expense-list">
          {expenses.length === 0 ? (
            <li className="empty-state">No expenses yet. Add your first expense above.</li>
          ) : (
            expenses.map((item) => (
              <li key={item.id} className="expense-item">
                <div>
                  <p className="expense-title">{item.title}</p>
                  <p className="expense-meta">
                    {item.category} • {item.date}
                  </p>
                </div>
                <div className="expense-actions">
                  <span className="expense-amount">${item.amount.toFixed(2)}</span>
                  <button className="delete-btn" type="button" onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

export default App;
