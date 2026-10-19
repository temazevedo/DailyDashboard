import { useEffect, useState } from 'react';

// Weather fallback when the browser geolocation fails or is denied.
const FALLBACK_CITY = { name: 'Braga', latitude: 41.5454, longitude: -8.4265 };

// Open-Meteo (WMO) weather code -> [day icon, night icon, condition text].
// Icon files are the Weather Icons SVGs vendored from Open-Meteo's website
// (client/public/icons). Codes not listed fall back to a generic cloud icon
// with no text.
const WEATHER_CODES = [
  { codes: [0], icon: 'wi-day-sunny', night: 'wi-night-clear', text: 'Clear sky' },
  { codes: [1], icon: 'wi-day-sunny-overcast', night: 'wi-night-alt-partly-cloudy', text: 'Mainly clear' },
  { codes: [2], icon: 'wi-day-cloudy', night: 'wi-night-alt-cloudy', text: 'Partly cloudy' },
  { codes: [3], icon: 'wi-cloudy', night: 'wi-night-cloudy', text: 'Overcast' },
  { codes: [45, 48], icon: 'wi-day-fog', night: 'wi-night-fog', text: 'Fog' },
  { codes: [51, 53, 55, 56, 57], icon: 'wi-day-sprinkle', night: 'wi-night-alt-sprinkle', text: 'Drizzle' },
  { codes: [61, 63, 65], icon: 'wi-day-rain', night: 'wi-night-alt-rain', text: 'Rain' },
  { codes: [66, 67], icon: 'wi-day-sleet', night: 'wi-night-alt-sleet', text: 'Freezing rain' },
  { codes: [71, 73, 75, 77], icon: 'wi-day-snow', night: 'wi-night-alt-snow', text: 'Snow' },
  { codes: [80, 81, 82], icon: 'wi-day-showers', night: 'wi-night-alt-showers', text: 'Rain showers' },
  { codes: [85, 86], icon: 'wi-day-snow', night: 'wi-night-alt-snow', text: 'Snow showers' },
  { codes: [95, 96, 99], icon: 'wi-day-thunderstorm', night: 'wi-night-alt-thunderstorm', text: 'Thunderstorm' },
];

function describe(code, isDay) {
  const match = WEATHER_CODES.find((entry) => entry.codes.includes(code));
  const icon = match ? (isDay ? match.icon : match.night) : isDay ? 'wi-cloudy' : 'wi-night-cloudy';
  return { icon, text: match ? match.text : null };
}

export default function WeatherCard() {
  const [weather, setWeather] = useState(null); // { temperature, code, isDay } | null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = ({ latitude, longitude }) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day`;
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (cancelled) return;
          const temperature = data && data.current && data.current.temperature_2m;
          const code = data && data.current && data.current.weather_code;
          if (typeof temperature !== 'number' || typeof code !== 'number') {
            throw new Error('unexpected response');
          }
          const isDay = (data.current && data.current.is_day) === 0 ? false : true;
          setWeather({ temperature, code, isDay });
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };

    if (!('geolocation' in navigator)) {
      loadWeather(FALLBACK_CITY);
      return undefined;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) {
          loadWeather({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      },
      () => {
        if (!cancelled) loadWeather(FALLBACK_CITY);
      },
      { timeout: 10000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <section className="card">
        <p className="weather-error">Weather unavailable</p>
      </section>
    );
  }

  if (!weather) {
    return (
      <section className="card">
        <p className="weather-loading">Loading...</p>
      </section>
    );
  }

  const condition = describe(weather.code, weather.isDay);

  return (
    <section className="card">
      <div className="weather">
        <img
          className="weather-icon"
          src={`/icons/${condition.icon}.svg`}
          alt=""
          aria-hidden="true"
        />
        <p className="weather-temp">{Math.round(weather.temperature)}&deg;C</p>
        {condition.text ? <p className="weather-text">{condition.text}</p> : null}
      </div>
    </section>
  );
}
