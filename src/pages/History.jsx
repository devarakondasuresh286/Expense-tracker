import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import CategoryFilter from '../components/CategoryFilter';

function History({
  addExpense,
  editExpense,
  deleteExpense,
  editingExpense,
  cancelEditing,
  filterCategory,
  setFilterCategory,
  filteredExpenses,
  expenseCount,
}) {
  return (
    <section className="page-grid" aria-label="Expense history page">
      <section className="content-grid">
        <article className="card form-card">
          <h2 className="section-title">Add or Edit Expense</h2>
          <ExpenseForm
            key={editingExpense?.id ?? 'new'}
            addExpense={addExpense}
            editExpense={editExpense}
            editingExpense={editingExpense}
            cancelEditing={cancelEditing}
          />
        </article>

        <article className="card list-card">
          <div className="list-header">
            <h2 className="section-title">Expense History</h2>
            <CategoryFilter filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
          </div>

          <ul className="expense-list">
            <ExpenseList
              expenses={filteredExpenses}
              hasAnyExpenses={expenseCount > 0}
              editExpense={editExpense}
              deleteExpense={deleteExpense}
            />
          </ul>
        </article>
      </section>
    </section>
  );
}

export default History;
