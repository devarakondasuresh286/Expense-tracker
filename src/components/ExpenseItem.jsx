function ExpenseItem({ expense, index, editExpense, deleteExpense }) {
  return (
    <li
      className="expense-item"
      style={{ '--item-index': index % 8 }}
    >
      <div>
        <p className="expense-title">{expense.title}</p>
        <p className="expense-meta">
          {expense.category} • {expense.date}
        </p>
      </div>
      <div className="expense-actions">
        <span className="expense-amount">${expense.amount.toFixed(2)}</span>
        <button className="edit-btn" type="button" onClick={() => editExpense(expense)}>
          Edit
        </button>
        <button className="delete-btn" type="button" onClick={() => deleteExpense(expense.id)}>
          Delete
        </button>
      </div>
    </li>
  );
}

export default ExpenseItem;