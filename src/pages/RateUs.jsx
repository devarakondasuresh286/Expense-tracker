import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_RATING = 5;

function RateUs() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [opinion, setOpinion] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const onSubmit = (event) => {
    event.preventDefault();

    if (!rating) {
      setMessage({ type: 'error', text: 'Please select a rating before submitting.' });
      return;
    }

    setMessage({ type: 'success', text: 'Thanks for your rating and feedback!' });
    setRating(0);
    setOpinion('');
  };

  return (
    <section className="page-grid" aria-label="Rate us page">
      <article className="card" style={{ maxWidth: 620, width: '100%', margin: '0 auto' }}>
        <div className="list-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title">Rate Us</h2>
          <button className="btn secondary-btn" type="button" onClick={() => navigate('/profile')}>
            Back to Profile
          </button>
        </div>

        <form className="expense-form" onSubmit={onSubmit}>
          <div>
            <p className="expense-meta" style={{ marginBottom: 10 }}>How would you rate Expense Tracker?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} aria-label="Select rating">
              {Array.from({ length: MAX_RATING }, (_, index) => {
                const value = index + 1;
                const selected = value <= rating;
                return (
                  <button
                    key={value}
                    className={selected ? 'btn' : 'btn secondary-btn'}
                    type="button"
                    onClick={() => {
                      setRating(value);
                      if (message.text) {
                        setMessage({ type: '', text: '' });
                      }
                    }}
                    aria-label={`Rate ${value} out of ${MAX_RATING}`}
                  >
                    {selected ? '★' : '☆'} {value}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            className="input"
            rows={5}
            placeholder="Share your opinion (optional)"
            value={opinion}
            onChange={(event) => setOpinion(event.target.value)}
            aria-label="Your opinion"
          />

          <button className="btn" type="submit">
            Submit Rating
          </button>

          {message.text ? <p className={`form-message ${message.type}`}>{message.text}</p> : null}
        </form>
      </article>
    </section>
  );
}

export default RateUs;
