import { useEffect, useMemo, useState } from 'react';
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from '../constants/expenseConstants';
import { normalizeSplitBetween, todayDateString } from '../utils/finance';

const createDefaultForm = (mode, defaultGroupId, defaultPaidBy) => ({
  title: '',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  notes: '',
  groupId: mode === EXPENSE_TYPES.GROUP ? defaultGroupId ?? '' : '',
  paidBy: mode === EXPENSE_TYPES.GROUP ? defaultPaidBy ?? '' : '',
  splitBetween: mode === EXPENSE_TYPES.GROUP ? [] : [],
  splitMode: 'equal',
  splitConfig: [],
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
    splitMode: expense.splitMode || 'equal',
    splitConfig: Array.isArray(expense.splitConfig)
      ? expense.splitConfig.map((item) => ({ userId: item.userId, amount: Number(item.amount || 0) }))
      : [],
    date: expense.date ?? todayDateString(),
  };
};

const buildEqualCustomSplitConfig = (members, totalAmount) => {
  if (!Array.isArray(members) || members.length === 0) {
    return [];
  }

  const normalizedAmount = Number(totalAmount || 0);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return members.map((member) => ({ userId: member.id, amount: 0 }));
  }

  const perMember = Math.floor((normalizedAmount / members.length) * 100) / 100;
  const rows = members.map((member) => ({ userId: member.id, amount: perMember }));
  const remainder = Number((normalizedAmount - perMember * members.length).toFixed(2));

  if (rows.length > 0) {
    rows[rows.length - 1].amount = Number((rows[rows.length - 1].amount + remainder).toFixed(2));
  }

  return rows;
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

  useEffect(() => {
    if (mode !== EXPENSE_TYPES.GROUP || editingExpense) {
      return;
    }

    setForm((prev) => {
      if (!Array.isArray(groups) || groups.length === 0) {
        if (!prev.groupId && !prev.paidBy) {
          return prev;
        }

        return {
          ...prev,
          groupId: '',
          paidBy: '',
          splitBetween: [],
          splitConfig: [],
        };
      }

      const hasCurrentGroup = groups.some((group) => group.id === prev.groupId);
      if (hasCurrentGroup) {
        return prev;
      }

      return {
        ...prev,
        groupId: groups[0].id,
      };
    });
  }, [mode, editingExpense, groups]);

  useEffect(() => {
    if (mode !== EXPENSE_TYPES.GROUP || editingExpense) {
      return;
    }

    setForm((prev) => {
      if (!Array.isArray(availableMembers) || availableMembers.length === 0) {
        if (!prev.paidBy) {
          return prev;
        }

        return {
          ...prev,
          paidBy: '',
          splitBetween: [],
          splitConfig: [],
        };
      }

      const hasValidPayer = availableMembers.some((member) => member.id === prev.paidBy);
      if (hasValidPayer) {
        return prev;
      }

      return {
        ...prev,
        paidBy: availableMembers[0].id,
      };
    });
  }, [mode, editingExpense, availableMembers]);

  useEffect(() => {
    if (
      mode !== EXPENSE_TYPES.GROUP
      || editingExpense
      || availableMembers.length === 0
      || form.splitMode !== 'equal'
    ) {
      return;
    }

    setForm((prev) => {
      if (prev.splitBetween.length > 0) {
        return prev;
      }

      return {
        ...prev,
        splitBetween: availableMembers.map((member) => member.id),
      };
    });
  }, [mode, editingExpense, availableMembers, form.splitMode]);

  useEffect(() => {
    if (mode !== EXPENSE_TYPES.GROUP || availableMembers.length === 0) {
      return;
    }

    setForm((prev) => {
      const memberIds = new Set(availableMembers.map((member) => member.id));

      if (prev.splitMode === 'equal') {
        return {
          ...prev,
          splitBetween: prev.splitBetween.filter((memberId) => memberIds.has(memberId)),
        };
      }

      const splitByUser = (prev.splitConfig || []).reduce((acc, item) => {
        if (memberIds.has(item.userId)) {
          acc[item.userId] = Number(item.amount || 0);
        }
        return acc;
      }, {});

      const nextSplitConfig = availableMembers.map((member) => ({
        userId: member.id,
        amount: Number(splitByUser[member.id] || 0),
      }));

      return {
        ...prev,
        splitConfig: nextSplitConfig,
      };
    });
  }, [mode, availableMembers]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'splitMode') {
      setForm((prev) => ({
        ...prev,
        splitMode: value,
        splitBetween: value === 'equal'
          ? normalizeSplitBetween(prev.splitBetween, availableMembers.map((member) => member.id))
          : prev.splitBetween,
        splitConfig: value === 'custom'
          ? (prev.splitConfig.length > 0
            ? prev.splitConfig
            : buildEqualCustomSplitConfig(availableMembers, prev.amount))
          : [],
      }));
    } else if (name === 'amount' && form.splitMode === 'custom') {
      setForm((prev) => ({
        ...prev,
        amount: value,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (formMessage.text) {
      setFormMessage({ type: '', text: '' });
    }
  };

  const handleCustomSplitAmountChange = (memberId, rawValue) => {
    const parsedValue = rawValue === '' ? '' : Number(rawValue);
    const nextAmount = rawValue === '' ? '' : (Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : 0);

    setForm((prev) => ({
      ...prev,
      splitConfig: (prev.splitConfig || []).map((item) =>
        item.userId === memberId
          ? { ...item, amount: nextAmount }
          : item,
      ),
    }));

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

      if (form.splitMode === 'custom') {
        const normalizedCustomSplit = (form.splitConfig || []).map((item) => ({
          userId: item.userId,
          amount: Number(item.amount || 0),
        }));
        const customTotal = normalizedCustomSplit.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const hasPositiveSplit = normalizedCustomSplit.some((item) => Number(item.amount || 0) > 0);

        if (!hasPositiveSplit) {
          setFormMessage({ type: 'error', text: 'Please enter at least one split amount.' });
          return;
        }

        if (Math.abs(customTotal - Number(form.amount)) > 0.01) {
          setFormMessage({ type: 'error', text: 'Custom split total must equal expense amount.' });
          return;
        }
      } else {
        const normalizedSplit = normalizeSplitBetween(form.splitBetween, [form.paidBy]);
        if (normalizedSplit.length === 0) {
          setFormMessage({ type: 'error', text: 'Please select at least one member to split.' });
          return;
        }
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
          ? (form.splitMode === 'equal'
            ? normalizeSplitBetween(form.splitBetween, [form.paidBy])
            : [])
          : [],
      splitMode: mode === EXPENSE_TYPES.GROUP ? form.splitMode : 'equal',
      splitConfig:
        mode === EXPENSE_TYPES.GROUP && form.splitMode === 'custom'
          ? (form.splitConfig || []).map((item) => ({ userId: item.userId, amount: Number(item.amount || 0) }))
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
            name="splitMode"
            value={form.splitMode}
            onChange={handleInputChange}
            aria-label="Split mode"
          >
            <option value="equal">Equal Split</option>
            <option value="custom">Custom Split</option>
          </select>

          <select
            className="input"
            name="groupId"
            value={form.groupId}
            onChange={handleInputChange}
            aria-label="Group"
          >
            <option value="" disabled>
              {groups.length === 0 ? 'No groups available' : 'Select group'}
            </option>
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
            disabled={availableMembers.length === 0}
          >
            <option value="" disabled>
              {availableMembers.length === 0 ? 'No members available' : 'Select who paid'}
            </option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {form.splitMode === 'equal' ? (
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
          ) : (
            <fieldset className="split-members-fieldset">
              <legend className="split-members-legend">Custom Split Amounts</legend>
              <div className="split-members-grid">
                {availableMembers.map((member) => {
                  const row = (form.splitConfig || []).find((item) => item.userId === member.id);
                  return (
                    <label key={member.id} className="split-member-option" style={{ alignItems: 'center', gap: 10 }}>
                      <span style={{ minWidth: 110 }}>{member.name}</span>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={row?.amount ?? 0}
                        onChange={(event) => handleCustomSplitAmountChange(member.id, event.target.value)}
                        aria-label={`${member.name} custom split amount`}
                      />
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
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