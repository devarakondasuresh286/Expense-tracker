import ExpenseItem from './ExpenseItem';

function ExpenseList({ expenses, hasAnyExpenses, editExpense, deleteExpense }) {
  if (!hasAnyExpenses) {
    return <li className="empty-state">No expenses yet. Add your first expense above.</li>;
  }

  if (expenses.length === 0) {
    return <li className="empty-state">No expenses found for the selected category.</li>;
  }

  return expenses.map((expense, index) => (
    <ExpenseItem
      key={expense.id}
      expense={expense}
      index={index}
      editExpense={editExpense}
      deleteExpense={deleteExpense}
    />
  ));
}

export default ExpenseList;