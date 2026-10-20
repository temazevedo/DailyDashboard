import { useState } from 'react';
import Header from './components/Header.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import EntryForm from './components/EntryForm.jsx';
import TaskCard from './components/TaskCard.jsx';
import GraphCard from './components/GraphCard.jsx';

export default function App() {
  // Bumped by EntryForm after each successful save; GraphCard refetches on
  // change so the graph reflects the new stats without a manual reload.
  const [statsRevision, setStatsRevision] = useState(0);

  return (
    <main className="page">
      <Header />
      <WeatherCard />
      <EntryForm onSaved={() => setStatsRevision((v) => v + 1)} />
      <TaskCard />
      <GraphCard statsRevision={statsRevision} />
    </main>
  );
}
