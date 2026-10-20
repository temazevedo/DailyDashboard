import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// Chart colors sampled from design/design-ref.png.
const SLEEP_COLOR = '#45a6f5';
const MOOD_COLOR = '#f84c5d';
const AXIS_STROKE = '#555';
const GRID_STROKE = '#444';
const AXIS_TEXT = '#9a9a9a';

const X_TICKS = [1, 5, 10, 15, 20, 25, 30];
const Y_TICKS = [0, 2, 4, 6, 8, 10];

// "YYYY-MM" helpers, local time only (no date library).
function todayMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month) {
  const year = Number(month.slice(0, 4));
  const month_num = Number(month.slice(5, 7));
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month_num - 1, 1));
}

function shiftMonth(month, delta) {
  const year = Number(month.slice(0, 4));
  const shifted = Number(month.slice(5, 7)) - 1 + delta;
  const norm = ((shifted % 12) + 12) % 12;
  const newYear = year + Math.floor(shifted / 12);
  return `${newYear}-${String(norm + 1).padStart(2, '0')}`;
}

function daysInMonth(month) {
  const year = Number(month.slice(0, 4));
  const month_num = Number(month.slice(5, 7));
  return new Date(year, month_num, 0).getDate();
}

// One decimal, or a dash when the SQL average is null for that metric.
function formatAverage(value) {
  if (typeof value !== 'number') {
    return '-';
  }
  return value.toFixed(1);
}

export default function GraphCard({ statsRevision }) {
  const [month, setMonth] = useState(todayMonth());
  const [data, setData] = useState(null); // { chart, average } | null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetch(`/api/stats?month=${month}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((stats) => {
        if (cancelled) return;
        setData({
          chart: stats.entries.map((row) => ({
            day: Number(row.date.slice(8)),
            mood: row.mood,
            sleep: row.sleep,
          })),
          average: stats.average,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [month, statsRevision]);

  if (failed) {
    return (
      <section className="card">
        <p className="graph-error">Could not load graph data.</p>
      </section>
    );
  }

  const isToday = month === todayMonth();

  return (
    <section className="card graph">
      <div className="graph-controls">
        <h2 className="graph-title">Sleep and mood</h2>
        <div className="graph-nav">
          <button
            className="graph-button"
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <span className="graph-month">{monthLabel(month)}</span>
          <button
            className="graph-button"
            type="button"
            aria-label="Next month"
            disabled={isToday}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>
      {data ? (
        <div className="graph-body">
          <div className="graph-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="day"
                  type="number"
                  domain={[1, daysInMonth(month)]}
                  ticks={X_TICKS}
                  stroke={AXIS_STROKE}
                  tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={Y_TICKS}
                  stroke={AXIS_STROKE}
                  tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                  tickLine={false}
                />
                <Line
                  dataKey="sleep"
                  stroke={SLEEP_COLOR}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  dataKey="mood"
                  stroke={MOOD_COLOR}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="graph-legend">
              <span className="graph-legend-a graph-legend-sleep">Sleep</span>
              <span className="graph-legend-a graph-legend-mood">Mood</span>
            </div>
          </div>
          <div className="graph-panel">
            <div className="graph-avg graph-avg-sleep">
              <p className="graph-avg-label">
                <i className="fa-solid fa-moon" aria-hidden="true" />
                Avg sleep
              </p>
              <p className="graph-avg-value">{formatAverage(data.average && data.average.sleep)}</p>
            </div>
            <div className="graph-avg graph-avg-mood">
              <p className="graph-avg-label">
                <i className="fa-solid fa-smile" aria-hidden="true" />
                Avg mood
              </p>
              <p className="graph-avg-value">{formatAverage(data.average && data.average.mood)}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="graph-loading">Loading...</p>
      )}
    </section>
  );
}
