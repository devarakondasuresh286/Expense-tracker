import { Link } from 'react-router-dom';

const friendExamples = [
  { name: 'Vinod', value: 420.0 },
  { name: 'Venkat', value: 315.5 },
  { name: 'Anil', value: 278.25 },
];

function Home({ monthlyTotal, totalSpent }) {
  return (
    <section className="home-page" aria-label="Home page">
      <h2 className="title">Welcome back</h2>
      <p className="subtitle">Track your daily spending and stay in control every month.</p>

      <div className="home-friends" aria-label="Friends example values">
        <p className="home-friends-title">Friends</p>
        <ul className="home-friends-list">
          {friendExamples.map((friend) => (
            <li key={friend.name} className="home-friend-item">
              <span className="home-friend-name">{friend.name}</span>
              <span className="home-friend-value">${friend.value.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn home-add-friend-btn">
          + Add Friends
        </button>
      </div>

      <h3 className="section-title">This Month</h3>
      <p className="home-total-value">${monthlyTotal.toFixed(2)}</p>
      <Link className="btn home-add-expense-btn" to="/history">
        Add Expense
      </Link>
      <p className="home-total-subtext">Overall tracked total: ${totalSpent.toFixed(2)}</p>
    </section>
  );
}

export default Home;
