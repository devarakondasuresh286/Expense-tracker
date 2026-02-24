function StatsCards({ totalSpent, expenseCount, categoriesUsed, latestExpense }) {
  return (
    <section className="stats-grid" aria-label="Expense overview">
      <article className="stat-card stat-total">
        <p className="stat-label">Total Spent</p>
        <strong className="stat-value">${totalSpent.toFixed(2)}</strong>
      </article>
      <article className="stat-card stat-count">
        <p className="stat-label">Expense Count</p>
        <strong className="stat-value">{expenseCount}</strong>
      </article>
      <article className="stat-card stat-category">
        <p className="stat-label">Categories Used</p>
        <strong className="stat-value">{categoriesUsed}</strong>
      </article>
      <article className="stat-card stat-latest">
        <p className="stat-label">Latest Expense</p>
        <strong className="stat-value latest-expense-title">
          {latestExpense ? latestExpense.title : 'No expenses yet'}
        </strong>
      </article>
    </section>
  );
}

export default StatsCards;