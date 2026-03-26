const escapeCsvValue = (value) => {
  const normalized = String(value ?? '');
  const escaped = normalized.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

export const downloadExpensesCsv = (expenses, filename = 'expense-report.csv') => {
  const header = [
    'Title',
    'Amount',
    'Category',
    'Type',
    'Date',
    'Notes',
    'Paid By',
    'Group Id',
  ];

  const rows = expenses.map((expense) => [
    expense.title,
    Number(expense.amount).toFixed(2),
    expense.category,
    expense.type,
    expense.date,
    expense.notes || '',
    expense.paidBy || '',
    expense.groupId || '',
  ]);

  const csvText = [header, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};
