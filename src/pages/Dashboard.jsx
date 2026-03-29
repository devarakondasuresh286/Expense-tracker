import { useMemo } from 'react';
import StatsCards from '../components/StatsCards';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlySummary from '../components/MonthlySummary';

function Dashboard({ expenses, totalSpent, expenseCount, categoriesUsed, latestExpense, analyticsSummary }) {
  const monthlyHighlights = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = (expenses || []).filter((expense) => {
      const date = new Date(expense.date);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const totalMonthlySpending = monthlyExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const categoryTotals = monthlyExpenses.reduce((acc, item) => {
      const key = item.category || 'Other';
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const categoryWise = Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }));

    const mostSpentCategory =
      categoryWise.length > 0
        ? categoryWise.reduce((max, current) => (current.total > max.total ? current : max), categoryWise[0])
        : null;

    return {
      totalMonthlySpending: Number(totalMonthlySpending.toFixed(2)),
      mostSpentCategory,
    };
  }, [expenses]);

  const highlights = analyticsSummary && Number(analyticsSummary?.totalMonthlySpending || 0) > 0
    ? analyticsSummary
    : monthlyHighlights;

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
          Total monthly spending: ${Number(highlights?.totalMonthlySpending || 0).toFixed(2)}
        </p>
        <p className="expense-meta">
          Most spent category:{' '}
          {highlights?.mostSpentCategory
            ? `${highlights.mostSpentCategory.category} ($${Number(highlights.mostSpentCategory.total).toFixed(2)})`
            : 'N/A'}
        </p>
      </article>
      <CategoryPieChart expenses={expenses} />
      <MonthlySummary expenses={expenses} />
    </section>
  );
}

export default Dashboard;
