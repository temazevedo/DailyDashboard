import express from 'express';
import db from './db.js';

const PORT = 3001;

const app = express();
app.use(express.json());

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// One row per day; empty optional fields are stored as NULL, never 0.
const upsertEntry = db.prepare(`
  INSERT INTO entries (date, weight_kg, mood, sleep)
  VALUES (@date, @weight_kg, @mood, @sleep)
  ON CONFLICT(date) DO UPDATE SET
    weight_kg = @weight_kg,
    mood = @mood,
    sleep = @sleep
`);

const selectEntry = db.prepare(
  'SELECT date, weight_kg, mood, sleep FROM entries WHERE date = ?',
);

function optionalInteger(value, label) {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    const message = `${label} must be an integer from 0 to 10`;
    throw new Error(message);
  }
  return value;
}

// Body fields: numbers or null; missing fields read as null.
function validateEntry(body) {
  const weight = body.weight_kg ?? null;
  if (weight !== null) {
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
      throw new Error('Weight must be a positive number');
    }
  }
  let mood = optionalInteger(body.mood, 'Mood');
  let sleep = optionalInteger(body.sleep, 'Sleep');
  return { weight_kg: weight, mood, sleep };
}

app.get('/api/entries/:date', (req, res) => {
  if (!DATE_PATTERN.test(req.params.date)) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  const entry = selectEntry.get(req.params.date);
  if (!entry) {
    return res.json({});
  }
  return res.json(entry);
});

app.put('/api/entries/:date', (req, res) => {
  if (!DATE_PATTERN.test(req.params.date)) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  try {
    const fields = validateEntry(req.body || {});
    upsertEntry.run({ date: req.params.date, ...fields });
    return res.status(200).json(selectEntry.get(req.params.date));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`DailyDashboard server listening on port ${PORT}`);
});
