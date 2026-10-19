import Header from './components/Header.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import EntryForm from './components/EntryForm.jsx';
import TaskCard from './components/TaskCard.jsx';
import GraphCard from './components/GraphCard.jsx';

export default function App() {
  return (
    <main className="page">
      <Header />
      <WeatherCard />
      <EntryForm />
      <TaskCard />
      <GraphCard />
    </main>
  );
}
