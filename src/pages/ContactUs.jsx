import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ContactUs() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const onSubmit = (event) => {
    event.preventDefault();

    if (!email.trim() || !messageBody.trim()) {
      setMessage({ type: 'error', text: 'Email and message are required.' });
      return;
    }

    setMessage({ type: 'success', text: 'Your message has been submitted. We will contact you soon.' });
    setEmail('');
    setMessageBody('');
  };

  return (
    <section className="page-grid" aria-label="Contact us page">
      <article className="card" style={{ maxWidth: 620, width: '100%', margin: '0 auto' }}>
        <div className="list-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title">Contact Us</h2>
          <button className="btn secondary-btn" type="button" onClick={() => navigate('/profile')}>
            Back to Profile
          </button>
        </div>

        <form className="expense-form" onSubmit={onSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            aria-label="Contact email"
          />

          <textarea
            className="input"
            rows={6}
            placeholder="Enter your message"
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            required
            aria-label="Contact message"
          />

          <button className="btn" type="submit">
            Submit
          </button>

          {message.text ? <p className={`form-message ${message.type}`}>{message.text}</p> : null}
        </form>
      </article>
    </section>
  );
}

export default ContactUs;
