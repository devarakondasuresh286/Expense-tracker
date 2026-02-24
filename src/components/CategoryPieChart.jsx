import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

function CategoryPieChart({ expenses }) {
  const groupedByCategory = expenses.reduce((accumulator, expense) => {
    const category = expense.category;
    const currentTotal = accumulator[category] ?? 0;
    accumulator[category] = currentTotal + Number(expense.amount);
    return accumulator;
  }, {});

  const chartData = Object.entries(groupedByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);
  const highestCategory = chartData.reduce(
    (currentHighest, item) =>
      !currentHighest || item.value > currentHighest.value ? item : currentHighest,
    null,
  );

  const renderSliceLabel = ({ name, percent }) => {
    if (!percent || percent < 0.08) {
      return '';
    }

    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <section className="chart-card" aria-label="Spending by category">
      <h2 className="section-title">Spending by Category</h2>

      {chartData.length === 0 ? (
        <p className="chart-empty-state">No data available to display chart.</p>
      ) : (
        <>
          <div className="chart-content">
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    activeIndex={-1}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="84%"
                    paddingAngle={2}
                    label={renderSliceLabel}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <aside className="chart-summary" aria-label="Category spending summary">
              <div className="chart-summary-item">
                <span className="chart-summary-label">Total Spending</span>
                <strong className="chart-summary-value">${totalSpent.toFixed(2)}</strong>
              </div>
              <div className="chart-summary-item">
                <span className="chart-summary-label">Highest Category</span>
                <strong className="chart-summary-value">
                  {highestCategory ? highestCategory.name : 'N/A'}
                </strong>
                {highestCategory ? (
                  <span className="chart-summary-subvalue">${highestCategory.value.toFixed(2)}</span>
                ) : null}
              </div>
              <div className="chart-summary-item">
                <span className="chart-summary-label">Categories</span>
                <strong className="chart-summary-value">{chartData.length}</strong>
              </div>
            </aside>
          </div>
          <ul className="chart-legend" aria-label="Chart color legend">
            {chartData.map((item, index) => {
              const percent = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;

              return (
                <li key={item.name} className="chart-legend-item">
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="chart-legend-name">{item.name}</span>
                  <span className="chart-legend-value">${item.value.toFixed(2)}</span>
                  <span className="chart-legend-percent">{percent.toFixed(1)}%</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export default CategoryPieChart;