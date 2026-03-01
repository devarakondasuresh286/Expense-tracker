function EmptyState({ message }) {
  return (
    <div className="empty-state-design" role="status" aria-live="polite">
      <svg
        className="empty-state-illustration"
        viewBox="0 0 180 120"
        aria-hidden="true"
      >
        <rect x="20" y="16" width="140" height="88" rx="12" fill="#eef2ff" stroke="#c7d2fe" />
        <rect x="34" y="34" width="68" height="10" rx="5" fill="#dbeafe" />
        <rect x="34" y="52" width="108" height="8" rx="4" fill="#e2e8f0" />
        <rect x="34" y="66" width="86" height="8" rx="4" fill="#e2e8f0" />
        <circle cx="130" cy="40" r="14" fill="#c7d2fe" />
        <path d="M130 31v8h8" fill="none" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="empty-state-title">No expenses added yet</p>
      <p className="empty-state-subtitle">{message}</p>
    </div>
  );
}

export default EmptyState;
