import 'dotenv/config';
import { connectDb } from './config/db.js';
import app from './app.js';

const PORT = Number(process.env.PORT || 4000);

const start = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required.');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required.');
  }

  await connectDb(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
