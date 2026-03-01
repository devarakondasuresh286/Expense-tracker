import ExpenseItem from './ExpenseItem';
import EmptyState from './EmptyState';

function ExpenseList({ expenses, hasAnyExpenses, editExpense, deleteExpense }) {
  if (!hasAnyExpenses) {
    return (
      <li>
        <EmptyState message="Add your first expense from the form to start tracking." />
      </li>
    );
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