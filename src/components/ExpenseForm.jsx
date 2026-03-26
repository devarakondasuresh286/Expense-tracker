import { useMemo, useState } from 'react';
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from '../constants/expenseConstants';
import { normalizeSplitBetween, todayDateString } from '../utils/finance';

const createDefaultForm = (mode, defaultGroupId, defaultPaidBy) => ({
  title: '',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  notes: '',
  groupId: mode === EXPENSE_TYPES.GROUP ? defaultGroupId ?? '' : '',
  paidBy: mode === EXPENSE_TYPES.GROUP ? defaultPaidBy ?? '' : '',
  splitBetween: mode === EXPENSE_TYPES.GROUP && defaultPaidBy ? [defaultPaidBy] : [],
  date: todayDateString(),
});

const createFormFromExpense = (expense, mode, defaultGroupId, defaultPaidBy) => {
  if (!expense) {
    return createDefaultForm(mode, defaultGroupId, defaultPaidBy);
  }

  return {
    title: expense.title,
    amount: String(expense.amount),
    category: expense.category ?? EXPENSE_CATEGORIES[0],
    notes: expense.notes ?? '',
    groupId: expense.groupId ?? defaultGroupId ?? '',
    paidBy: expense.paidBy ?? defaultPaidBy ?? '',
    splitBetween: Array.isArray(expense.splitBetween) ? expense.splitBetween : [],
    date: expense.date ?? todayDateString(),
  };
};

function ExpenseForm({
  mode,
  addExpense,
  editExpense,
  editingExpense,
  cancelEditing,
  groups = [],
  membersById = {},
  currentUser,
  defaultGroupId,
}) {
  const initialGroupId = defaultGroupId ?? groups[0]?.id ?? '';
  const initialPaidBy = currentUser?.id ?? '';
  const [form, setForm] = useState(() => createFormFromExpense(editingExpense, mode, initialGroupId, initialPaidBy));
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === form.groupId) ?? groups.find((group) => group.id === initialGroupId) ?? null,
    [form.groupId, groups, initialGroupId],
  );

  const availableMembers = useMemo(() => {
    if (mode !== EXPENSE_TYPES.GROUP || !selectedGroup) {
      return [];
    }

    return selectedGroup.memberIds.map((memberId) => membersById[memberId]).filter(Boolean);
  }, [mode, selectedGroup, membersById]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formMessage.text) {
      setFormMessage({ type: '', text: '' });
    }
  };

  const handleSplitToggle = (memberId) => {
    setForm((prev) => {
      const exists = prev.splitBetween.includes(memberId);

      if (exists) {
        const nextSplit = prev.splitBetween.filter((id) => id !== memberId);
        return {
          ...prev,
          splitBetween: nextSplit,
        };
      }

      return {
        ...prev,
        splitBetween: [...prev.splitBetween, memberId],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setFormMessage({ type: 'error', text: 'Please enter title.' });
      return;
    }

    if (!form.amount) {
      setFormMessage({ type: 'error', text: 'Please enter amount.' });
      return;
    }

    if (Number(form.amount) <= 0) {
      setFormMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    if (!form.date) {
      setFormMessage({ type: 'error', text: 'Please select date.' });
      return;
    }

    if (mode === EXPENSE_TYPES.GROUP) {
      if (!form.groupId) {
        setFormMessage({ type: 'error', text: 'Please select group.' });
        return;
      }

      if (!form.paidBy) {
        setFormMessage({ type: 'error', text: 'Please choose who paid.' });
        return;
      }

      const normalizedSplit = normalizeSplitBetween(form.splitBetween, [form.paidBy]);
      if (normalizedSplit.length === 0) {
        setFormMessage({ type: 'error', text: 'Please select at least one member to split.' });
        return;
      }
    }

    const expenseData = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      notes: form.notes?.trim() || '',
      type: mode,
      groupId: mode === EXPENSE_TYPES.GROUP ? form.groupId : null,
      paidBy: mode === EXPENSE_TYPES.GROUP ? form.paidBy : currentUser.id,
      splitBetween:
        mode === EXPENSE_TYPES.GROUP
          ? normalizeSplitBetween(form.splitBetween, [form.paidBy])
          : [],
      date: form.date,
    };

    if (editingExpense) {
      editExpense(editingExpense.id, expenseData);
      setFormMessage({ type: 'success', text: 'Expense updated successfully.' });
    } else {
      addExpense(expenseData);
      setFormMessage({ type: 'success', text: 'Expense added successfully.' });
    }

    setForm(createFormFromExpense(null, mode, form.groupId || initialGroupId, form.paidBy || initialPaidBy));
  };

  const handleCancel = () => {
    setFormMessage({ type: '', text: '' });
    cancelEditing();
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <input
        className="input"
        type="text"
        name="title"
        value={form.title}
        onChange={handleInputChange}
        placeholder="Expense title"
        aria-label="Expense title"
      />
      <input
        className="input"
        type="number"
        name="amount"
        value={form.amount}
        onChange={handleInputChange}
        placeholder="Amount"
        min="0"
        step="0.01"
        aria-label="Expense amount"
      />
      <select
        className="input"
        name="category"
        value={form.category}
        onChange={handleInputChange}
        aria-label="Expense category"
      >
        {EXPENSE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <textarea
        className="input"
        name="notes"
        value={form.notes}
        onChange={handleInputChange}
        placeholder="Notes (optional)"
        rows={3}
      />

      {mode === EXPENSE_TYPES.GROUP ? (
        <>
          <select
            className="input"
            name="groupId"
            value={form.groupId}
            onChange={handleInputChange}
            aria-label="Group"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            name="paidBy"
            value={form.paidBy}
            onChange={handleInputChange}
            aria-label="Paid by"
          >
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <fieldset className="split-members-fieldset">
            <legend className="split-members-legend">Split Between</legend>
            <div className="split-members-grid">
              {availableMembers.map((member) => (
                <label key={member.id} className="split-member-option">
                  <input
                    type="checkbox"
                    checked={form.splitBetween.includes(member.id)}
                    onChange={() => handleSplitToggle(member.id)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      <input
        className="input"
        type="date"
        name="date"
        value={form.date}
        onChange={handleInputChange}
        aria-label="Expense date"
      />
      <button className="btn" type="submit">
        {editingExpense ? 'Update Expense' : 'Add Expense'}
      </button>
      {editingExpense ? (
        <button className="btn secondary-btn" type="button" onClick={handleCancel}>
          Cancel
        </button>
      ) : null}

      {formMessage.text ? (
        <p className={`form-message ${formMessage.type}`} role="status" aria-live="polite">
          {formMessage.text}
        </p>
      ) : null}
    </form>
  );
}

export default ExpenseForm;