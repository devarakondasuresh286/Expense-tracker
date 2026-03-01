import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function MonthlySummary({ expenses }) {
  const groupedByMonth = expenses.reduce((accumulator, expense) => {
    const date = new Date(expense.date);

    if (Number.isNaN(date.getTime())) {
      return accumulator;
    }

    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const monthLabel = date.toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    if (!accumulator[key]) {
      accumulator[key] = {
        month: monthLabel,
        total: 0,
      };
    }

    accumulator[key].total += Number(expense.amount);
    return accumulator;
  }, {});

  const monthlyData = Object.keys(groupedByMonth)
    .sort((firstKey, secondKey) => firstKey.localeCompare(secondKey))
    .map((key) => ({
      month: groupedByMonth[key].month,
      total: Number(groupedByMonth[key].total.toFixed(2)),
    }));

  return (
    <section className="monthly-card" aria-label="Monthly spending overview">
      <h2 className="section-title">Monthly Spending Overview</h2>

      {monthlyData.length === 0 ? (
        <p className="monthly-empty-state">No monthly data available.</p>
      ) : (
        <div className="monthly-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 14, left: 4, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  border: '1px solid #dbe3ee',
                  borderRadius: '10px',
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                }}
              />
              <Bar dataKey="total" fill="#4f46e5" radius={[8, 8, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default MonthlySummary;