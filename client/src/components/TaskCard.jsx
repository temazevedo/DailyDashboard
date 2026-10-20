import { useEffect, useState } from 'react';
import { todayKey } from '../todayKey';
import { fetchJson } from '../fetchJson';

function TaskRow({ task, showDate, act }) {
  const done = task.done === 1;
  return (
    <div className="task-row">
      <button
        className={done ? 'task-check task-check-done' : 'task-check'}
        type="button"
        aria-label={done ? 'Mark not done' : 'Mark done'}
        onClick={() => act(`/api/tasks/${task.id}`, 'PATCH')}
      >
        {done ? <i className="fa-solid fa-check" aria-hidden="true" /> : null}
      </button>
      <span className={done ? 'task-text task-text-done' : 'task-text'}>
        {task.text}
      </span>
      {showDate ? (
        <span className="task-date">
          {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(
            new Date(`${task.date}T00:00:00`),
          )}
        </span>
      ) : null}
      <button
        className="task-delete"
        type="button"
        aria-label="Delete task"
        onClick={() => act(`/api/tasks/${task.id}`, 'DELETE')}
      >
        <i className="fa-solid fa-trash-can" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function TaskCard() {
  const [today, setToday] = useState([]);
  const [unfinished, setUnfinished] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null); // action status text
  const [failed, setFailed] = useState(false); // initial load failure
  const [showCompleted, setShowCompleted] = useState(false);

  const loadTasks = () =>
    fetchJson(`/api/tasks?date=${todayKey()}`, 'Save failed').then((lists) => {
      setToday(lists.today);
      setUnfinished(lists.unfinished);
      setCompleted(lists.completed);
    });

  const act = (url, method, body) => {
    const options =
      method === 'POST'
        ? {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : { method };
    setStatus(null);
    return fetchJson(url, 'Save failed', options)
      .then(() => loadTasks())
      .catch((error) => setStatus(error.message));
  };

  useEffect(() => {
    let cancelled = false;
    loadTasks().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = (event) => {
    event.preventDefault();
    act('/api/tasks', 'POST', { text, date: todayKey() })
      .then(() => setText(''));
  };

  if (failed) {
    return (
      <section className="card">
        <p className="task-error">Could not load tasks.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="tasks">
        <h2 className="tasks-title">Tasks</h2>
        <form className="task-adder" onSubmit={handleAdd}>
          <input
            className="task-input"
            type="text"
            placeholder="Add a task for today"
            aria-label="Add a task for today"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button className="task-add-button" type="submit" aria-label="Add task">
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </button>
        </form>
        {status ? (
          <p className="task-error" role="status">
            {status}
          </p>
        ) : null}
        <p className="tasks-label tasks-label-today">Today</p>
        <div className="task-list">
          {today.map((task) => (
            <TaskRow key={task.id} task={task} showDate={false} act={act} />
          ))}
        </div>
        <p className="tasks-label tasks-label-unfinished">
          Unfinished from earlier days
        </p>
        <div className="task-list">
          {unfinished.map((task) => (
            <TaskRow key={task.id} task={task} showDate act={act} />
          ))}
        </div>
        {completed.length > 0 ? (
          <>
            <p className="tasks-label">
              <button
                className="task-group-toggle"
                type="button"
                aria-expanded={showCompleted}
                aria-label={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <i
                  className={
                    showCompleted
                      ? 'fa-solid fa-chevron-down'
                      : 'fa-solid fa-chevron-right'
                  }
                  aria-hidden="true"
                />
                Completed ({completed.length})
              </button>
            </p>
            {showCompleted ? (
              <div className="task-list">
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDate={task.date !== todayKey()}
                    act={act}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
