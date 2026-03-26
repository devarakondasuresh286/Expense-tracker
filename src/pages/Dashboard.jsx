import StatsCards from '../components/StatsCards';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlySummary from '../components/MonthlySummary';

function Dashboard({ expenses, totalSpent, expenseCount, categoriesUsed, latestExpense, analyticsSummary }) {
  return (
    <section className="page-grid" aria-label="Dashboard page">
      <StatsCards
        totalSpent={totalSpent}
        expenseCount={expenseCount}
        categoriesUsed={categoriesUsed}
        latestExpense={latestExpense}
      />
      <article className="card">
        <h2 className="section-title">Monthly Highlights</h2>
        <p className="expense-meta">
          Total monthly spending: ${Number(analyticsSummary?.totalMonthlySpending || 0).toFixed(2)}
        </p>
        <p className="expense-meta">
          Most spent category:{' '}
          {analyticsSummary?.mostSpentCategory
            ? `${analyticsSummary.mostSpentCategory.category} ($${Number(analyticsSummary.mostSpentCategory.total).toFixed(2)})`
            : 'N/A'}
        </p>
      </article>
      <CategoryPieChart expenses={expenses} />
      <MonthlySummary expenses={expenses} />
    </section>
  );
}

export default Dashboard;
