function Profile({ expenseCount, totalSpent, totalGroupsJoined, highestSpendingCategory }) {
  const memberSinceDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="page-grid" aria-label="Profile page">
      <article className="card profile-card">
        <h2 className="section-title">Profile</h2>
        <p className="subtitle">Frontend-only setup for now. Backend integration can be added later.</p>
        <div className="profile-stats">
          <p>
            <strong>Username:</strong> Alex User
          </p>
          <p>
            <strong>Email:</strong> alex.user@example.com
          </p>
          <p>
            <strong>Total groups joined:</strong> {totalGroupsJoined}
          </p>
          <p>
            <strong>Highest spending category:</strong> {highestSpendingCategory}
          </p>
          <p>
            <strong>Member since:</strong> {memberSinceDate}
          </p>
          <p>
            <strong>Tracked expenses:</strong> {expenseCount}
          </p>
          <p>
            <strong>Total spent:</strong> ${totalSpent.toFixed(2)}
          </p>
        </div>
      </article>
    </section>
  );
}

export default Profile;
