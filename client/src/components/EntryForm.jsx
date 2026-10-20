import { useEffect, useState } from 'react';
import { todayKey } from '../todayKey';
import { fetchJson } from '../fetchJson';

const EMPTY_FIELDS = { weight_kg: '', mood: '', sleep: '' };

// One status region below the inputs; strings here replace each other.
// Failures set the display text directly (via fetchJson fallbacks); only a
// successful save maps to the short 'Saved.' line.
function statusLine(status) {
  if (status === 'saved') return 'Saved.';
  return status;
}

// Empty input -> null (never 0); any other value -> number.
function toPayloadField(value) {
  if (value === '') return null;
  return Number(value);
}

export default function EntryForm({ onSaved }) {
  const [fields, setFields] = useState(EMPTY_FIELDS); // number inputs kept as strings
  const [status, setStatus] = useState(null); // 'saved' | 'load-failed' | 'save-failed' | server error text

  useEffect(() => {
    let cancelled = false;
    fetchJson(`/api/entries/${todayKey()}`, "Could not load today's entry.")
      .then((entry) => {
        if (cancelled) return;
        setFields({
          weight_kg: entry.weight_kg ?? '',
          mood: entry.mood ?? '',
          sleep: entry.sleep ?? '',
        });
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = (event) => {
    event.preventDefault();
    fetchJson(`/api/entries/${todayKey()}`, 'Save failed', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_kg: toPayloadField(fields.weight_kg),
        mood: toPayloadField(fields.mood),
        sleep: toPayloadField(fields.sleep),
      }),
    })
      .then(() => {
        setStatus('saved');
        if (onSaved) onSaved();
      })
      .catch((error) => {
        setStatus(error.message);
      });
  };

  const handleChange = (key) => (event) => {
    setStatus(null);
    setFields({ ...fields, [key]: event.target.value });
  };

  return (
    <section className="card">
      <form className="entry" onSubmit={handleSave}>
        <h2 className="entry-title">{"Today's entry"}</h2>
        <div className="entry-row">
          <div className="entry-field">
            <label className="entry-label" htmlFor="entry-weight">
              <i className="fa-solid fa-weight-scale" aria-hidden="true" />
              Weight (kg)
            </label>
            <input
              className="entry-input"
              id="entry-weight"
              type="number"
              step="0.1"
              value={fields.weight_kg}
              onChange={handleChange('weight_kg')}
            />
          </div>
          <div className="entry-field">
            <label className="entry-label" htmlFor="entry-mood">
              <i className="fa-solid fa-smile" aria-hidden="true" />
              Mood (0-10)
            </label>
            <input
              className="entry-input"
              id="entry-mood"
              type="number"
              step="1"
              value={fields.mood}
              onChange={handleChange('mood')}
            />
          </div>
          <div className="entry-field">
            <label className="entry-label" htmlFor="entry-sleep">
              <i className="fa-solid fa-moon" aria-hidden="true" />
              Sleep (0-10)
            </label>
            <input
              className="entry-input"
              id="entry-sleep"
              type="number"
              step="1"
              value={fields.sleep}
              onChange={handleChange('sleep')}
            />
          </div>
        </div>
        <div className="entry-actions">
          <button className="entry-button" type="submit">
            Save
          </button>
        </div>
        {status ? (
          <p
            className={status === 'saved' ? 'entry-status' : 'entry-error'}
            role="status"
          >
            {statusLine(status)}
          </p>
        ) : null}
      </form>
    </section>
  );
}
