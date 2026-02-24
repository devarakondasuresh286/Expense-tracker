import { useEffect, useState } from 'react';
import { EXPENSE_CATEGORIES } from '../constants/expenseConstants';

const defaultForm = { title: '', amount: '', category: EXPENSE_CATEGORIES[0], date: '' };

function ExpenseForm({ addExpense, editExpense, editingExpense, cancelEditing }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!editingExpense) {
      setForm(defaultForm);
      return;
    }

    setForm({
      title: editingExpense.title,
      amount: String(editingExpense.amount),
      category: editingExpense.category,
      date: editingExpense.date,
    });
  }, [editingExpense]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.amount || !form.date) {
      return;
    }

    const expenseData = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    };

    if (editingExpense) {
      editExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    setForm(defaultForm);
  };

  return (
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
        {EXPENSE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
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
        {editingExpense ? 'Update Expense' : 'Add Expense'}
      </button>
      {editingExpense ? (
        <button className="btn secondary-btn" type="button" onClick={cancelEditing}>
          Cancel
        </button>
      ) : null}
    </form>
  );
}

export default ExpenseForm;