import express from 'express';
import db from './db.js';

// No API endpoints yet: features 2-5 add them.

const PORT = 3001;

const app = express();
app.use(express.json());

app.listen(PORT, () => {
  console.log(`DailyDashboard server listening on port ${PORT}`);
});
