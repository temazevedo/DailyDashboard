import Header from './components/Header.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import EntryForm from './components/EntryForm.jsx';

export default function App() {
  return (
    <main className="page">
      <Header />
      <WeatherCard />
      <EntryForm />
    </main>
  );
}
