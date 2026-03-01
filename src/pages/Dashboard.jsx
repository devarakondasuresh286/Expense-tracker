import StatsCards from '../components/StatsCards';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlySummary from '../components/MonthlySummary';

function Dashboard({ expenses, totalSpent, expenseCount, categoriesUsed, latestExpense }) {
  return (
    <section className="page-grid" aria-label="Dashboard page">
      <StatsCards
        totalSpent={totalSpent}
        expenseCount={expenseCount}
        categoriesUsed={categoriesUsed}
        latestExpense={latestExpense}
      />
      <CategoryPieChart expenses={expenses} />
      <MonthlySummary expenses={expenses} />
    </section>
  );
}

export default Dashboard;
