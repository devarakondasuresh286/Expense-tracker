import { useState } from 'react';
import { DEFAULT_EXPENSE_GROUP, EXPENSE_CATEGORIES, EXPENSE_GROUPS } from '../constants/expenseConstants';

const defaultForm = {
  title: '',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  group: DEFAULT_EXPENSE_GROUP,
  date: '',
};

const createFormFromExpense = (expense) => {
  if (!expense) {
    return defaultForm;
  }

  return {
    title: expense.title,
    amount: String(expense.amount),
    category: expense.category,
    group: expense.group ?? DEFAULT_EXPENSE_GROUP,
    date: expense.date,
  };
};

function ExpenseForm({ addExpense, editExpense, editingExpense, cancelEditing }) {
  const [form, setForm] = useState(() => createFormFromExpense(editingExpense));
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formMessage.text) {
      setFormMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setFormMessage({ type: 'error', text: 'Please enter title.' });
      return;
    }

    if (!form.amount) {
      setFormMessage({ type: 'error', text: 'Please enter amount.' });
      return;
    }

    if (Number(form.amount) <= 0) {
      setFormMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    if (!form.date) {
      setFormMessage({ type: 'error', text: 'Please select date.' });
      return;
    }

    const expenseData = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      group: form.group,
      date: form.date,
    };

    if (editingExpense) {
      editExpense(editingExpense.id, expenseData);
      setFormMessage({ type: 'success', text: 'Expense updated successfully.' });
    } else {
      addExpense(expenseData);
      setFormMessage({ type: 'success', text: 'Expense added successfully.' });
    }

    setForm(createFormFromExpense(null));
  };

  const handleCancel = () => {
    setFormMessage({ type: '', text: '' });
    cancelEditing();
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
      <select
        className="input"
        name="group"
        value={form.group}
        onChange={handleInputChange}
        aria-label="Expense group"
      >
        {EXPENSE_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
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
        <button className="btn secondary-btn" type="button" onClick={handleCancel}>
          Cancel
        </button>
      ) : null}

      {formMessage.text ? (
        <p className={`form-message ${formMessage.type}`} role="status" aria-live="polite">
          {formMessage.text}
        </p>
      ) : null}
    </form>
  );
}

export default ExpenseForm;