import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, MapPin, Droplets, Wind, Thermometer, Cloud, Sun,
  CloudRain, Zap, Snowflake, Sunrise, Sunset, Eye, Activity, Navigation
} from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';

const API_KEY = 'b0b8a89df9338cd9eb0ad5a2a754dbf3';

const App = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [background, setBackground] = useState('/clips/clearSky_day.mp4');

  const weatherVideos = {
    Clear: { day: '/clips/clearSky_day.mp4', night: '/clips/clearSky_night.mp4' },
    Clouds: '/clips/cloudy.mp4',
    Rain: '/clips/rain.mp4',
    Drizzle: '/clips/rain.mp4',
    Thunderstorm: '/clips/thunderstorm.mp4',
    Snow: { day: '/clips/snow_day.mp4', night: '/clips/snow_night.mp4' },
    Default: '/clips/cloudy.mp4'
  };

  const getBackground = (condition, icon) => {
    const isNight = icon.includes('n');
    const mapping = weatherVideos[condition] || weatherVideos.Default;
    if (typeof mapping === 'object') return isNight ? mapping.night : mapping.day;
    return mapping;
  };

  const getWeatherIcon = (condition, size = 24) => {
    switch (condition) {
      case 'Clear': return <Sun size={size} />;
      case 'Clouds': return <Cloud size={size} />;
      case 'Rain': case 'Drizzle': return <CloudRain size={size} />;
      case 'Thunderstorm': return <Zap size={size} />;
      case 'Snow': return <Snowflake size={size} />;
      default: return <Cloud size={size} />;
    }
  };

  const fetchWeather = async (searchCity) => {
    if (!searchCity) return;
    setLoading(true); setError('');

    try {
      if (API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
        setTimeout(() => {
          const mock = getMockData(searchCity);
          setWeatherData(mock);
          setBackground(getBackground(mock.current.condition, mock.current.icon));
          setLoading(false);
        }, 1000);
        return;
      }

      // Fetch current weather
      const currentRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&units=metric&appid=${API_KEY}`
      );

      // Fetch 5-day forecast (3-hour intervals)
      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&units=metric&appid=${API_KEY}`
      );

      const current = currentRes.data;
      const forecast = forecastRes.data.list;

      // Parse hourly (next 24 hours = 9 items to cover a full 24h span)
      const hourly = forecast.slice(0, 9).map(item => ({
        time: new Date((item.dt + current.timezone) * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main
      }));

      // Parse daily (group by day)
      const dailyMap = {};
      forecast.forEach(item => {
        const date = new Date((item.dt + current.timezone) * 1000).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
        if (!dailyMap[date]) dailyMap[date] = { min: item.main.temp_min, max: item.main.temp_max, condition: item.weather[0].main };
        else {
          dailyMap[date].min = Math.min(dailyMap[date].min, item.main.temp_min);
          dailyMap[date].max = Math.max(dailyMap[date].max, item.main.temp_max);
        }
      });
      const daily = Object.keys(dailyMap).slice(0, 7).map(date => ({
        day: date,
        min: Math.round(dailyMap[date].min),
        max: Math.round(dailyMap[date].max),
        condition: dailyMap[date].condition
      }));

      const parsedData = {
        name: current.name,
        timezone: current.timezone,
        current: {
          temp: Math.round(current.main.temp),
          condition: current.weather[0].main,
          icon: current.weather[0].icon,
          dt: current.dt,
          feels_like: Math.round(current.main.feels_like)
        },
        highlights: {
          uv: Math.round(Math.random() * 10), // Mock UV as it's not in 2.5 weather
          wind: current.wind.speed,
          humidity: current.main.humidity,
          visibility: (current.visibility / 1000).toFixed(1),
          airQuality: Math.floor(Math.random() * 200 + 50), // Mock AQI
          sunrise: new Date((current.sys.sunrise + current.timezone) * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }),
          sunset: new Date((current.sys.sunset + current.timezone) * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })
        },
        hourly,
        daily
      };

      setWeatherData(parsedData);
      setBackground(getBackground(parsedData.current.condition, parsedData.current.icon));
    } catch (err) {
      console.error('Weather API Error:', err);
      if (err.response) {
        if (err.response.status === 401) setError('Invalid API Key. Please check your OpenWeatherMap key.');
        else if (err.response.status === 404) setError('City not found. Please check the spelling.');
        else setError('An error occurred. Please try again later.');
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      if (API_KEY !== 'YOUR_OPENWEATHER_API_KEY') setLoading(false);
    }
  };

  const getMockData = (cityName) => {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];
    const rCond = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
      timezone: 0,
      current: {
        temp: Math.floor(Math.random() * 15 + 20),
        condition: rCond,
        icon: '01d',
        dt: Math.floor(Date.now() / 1000),
      },
      highlights: {
        uv: 10,
        wind: 15.1,
        humidity: 45,
        visibility: 10.0,
        airQuality: 157,
        sunrise: '04:59 AM',
        sunset: '06:18 PM'
      },
      hourly: [
        { time: 'Now', temp: 37, condition: 'Clear' },
        { time: '11 AM', temp: 37, condition: 'Clear' },
        { time: '2 PM', temp: 39, condition: 'Clouds' },
        { time: '5 PM', temp: 41, condition: 'Clear' },
        { time: '8 PM', temp: 36, condition: 'Clouds' },
        { time: '11 PM', temp: 34, condition: 'Rain' },
        { time: '2 AM', temp: 32, condition: 'Rain' },
        { time: '5 AM', temp: 30, condition: 'Clear' },
        { time: '8 AM', temp: 29, condition: 'Clear' },
      ],
      daily: [
        { day: 'Today', min: 34, max: 44, condition: 'Clear' },
        { day: 'Tue', min: 30, max: 44, condition: 'Clear' },
        { day: 'Wed', min: 30, max: 42, condition: 'Clouds' },
        { day: 'Thu', min: 29, max: 43, condition: 'Clear' },
        { day: 'Fri', min: 28, max: 43, condition: 'Clouds' },
        { day: 'Sat', min: 29, max: 34, condition: 'Rain' },
        { day: 'Sun', min: 28, max: 37, condition: 'Clear' },
      ]
    };
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  const formatDateWithOffset = (timestamp, offset) => {
    const date = new Date((timestamp + offset) * 1000);
    return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTimeWithOffset = (timestamp, offset) => {
    const date = new Date((timestamp + offset) * 1000);
    return date.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p>{label}</p>
          <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{`${payload[0].value}°C`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-wrapper">
      <video key={background} autoPlay loop muted playsInline className="video-background">
        <source src={background} type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '20px', zIndex: 10, background: 'var(--glass-bg)', borderRadius: '16px' }}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => { setError(''); setCity(''); }} style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', cursor: 'pointer', color: 'white' }}>Go Back</button>
        </div>
      ) : !weatherData ? (
        <div className="initial-search-container" style={{
          zIndex: 10,
          background: 'var(--glass-bg)',
          padding: '40px',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{ color: 'white', fontSize: '28px', margin: 0, textAlign: 'center', fontWeight: '600' }}>Welcome to SkyCast</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', margin: 0, fontSize: '15px', lineHeight: '1.5' }}>Enter a city to get real-time weather forecasts and insights.</p>
          <form onSubmit={handleSearch} style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Search city..."
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'white',
                outline: 'none',
                fontSize: '16px',
                transition: 'border-color 0.3s'
              }}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="submit" style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s, background 0.3s'
            }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Search size={20} />
            </button>
          </form>
        </div>
      ) : weatherData ? (
        <div className="dashboard-container">

          {/* Sidebar */}
          <div className="sidebar">
            <form onSubmit={handleSearch} className="search-container">
              <input
                type="text"
                placeholder="Search city..."
                className="search-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <button type="submit" className="search-button"><Search size={20} /></button>
            </form>

            <div className="current-weather">
              <MapPin className="location-icon" size={32} />
              <h1 className="city-name">{weatherData.name}</h1>
              <div className="date-time">
                {formatDateWithOffset(weatherData.current.dt, weatherData.timezone)}
                <span className="time-accent">
                  {formatTimeWithOffset(weatherData.current.dt, weatherData.timezone)}
                </span>
              </div>

              <div className="main-temp">
                {weatherData.current.temp}
                <span className="main-temp-unit">°C</span>
              </div>
              <div className="main-condition">{weatherData.current.condition}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">

            {/* Highlights */}
            <div className="glass-panel">
              <h2 className="section-title">Today's Highlights</h2>
              <div className="highlights-grid">

                <div className="highlight-card">
                  <div className="highlight-header"><Sun className="highlight-icon" size={18} /> UV Index</div>
                  <div className="highlight-value">{weatherData.highlights.uv}</div>
                  <div className="highlight-footer">{weatherData.highlights.uv > 7 ? 'High' : 'Normal'}</div>
                </div>

                <div className="highlight-card">
                  <div className="highlight-header"><Wind className="highlight-icon" size={18} /> Wind Status</div>
                  <div className="highlight-value">{weatherData.highlights.wind} <span className="highlight-unit">km/h</span></div>
                  <div className="highlight-footer">Wind Speed</div>
                </div>

                <div className="highlight-card">
                  <div className="highlight-header"><Sunrise className="highlight-icon" size={18} /> Sunrise & Sunset</div>
                  <div className="sun-times">
                    <div className="sun-item">
                      <Sunrise className="sun-icon" size={24} />
                      <div>
                        <div className="sun-time-val">{weatherData.highlights.sunrise}</div>
                        <div className="sun-time-label">Sunrise</div>
                      </div>
                    </div>
                    <div className="sun-item">
                      <Sunset className="sun-icon" size={24} />
                      <div>
                        <div className="sun-time-val">{weatherData.highlights.sunset}</div>
                        <div className="sun-time-label">Sunset</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="highlight-card">
                  <div className="highlight-header"><Droplets className="highlight-icon" size={18} /> Humidity</div>
                  <div className="highlight-value">{weatherData.highlights.humidity} <span className="highlight-unit">%</span></div>
                  <div className="highlight-footer">{weatherData.highlights.humidity > 60 ? 'High' : 'Normal'}</div>
                </div>

                <div className="highlight-card">
                  <div className="highlight-header"><Eye className="highlight-icon" size={18} /> Visibility</div>
                  <div className="highlight-value">{weatherData.highlights.visibility} <span className="highlight-unit">km</span></div>
                  <div className="highlight-footer">Clear view</div>
                </div>

                <div className="highlight-card">
                  <div className="highlight-header"><Activity className="highlight-icon" size={18} /> Air Quality</div>
                  <div className="highlight-value">{weatherData.highlights.airQuality}</div>
                  <div className="highlight-footer">{weatherData.highlights.airQuality > 100 ? 'Unhealthy' : 'Good'}</div>
                </div>

              </div>
            </div>

            {/* Hourly Chart */}
            <div className="glass-panel">
              <h2 className="section-title">Today's Temperature At</h2>
              <div className="chart-scroll-wrapper">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weatherData.hourly}>
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} padding={{ left: 20, right: 20 }} interval={0} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="temp" stroke="var(--accent)" strokeWidth={3} dot={{ fill: 'var(--accent)', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="glass-panel">
              <h2 className="section-title">6-Day Forecast</h2>
              <div className="forecast-row">
                {weatherData.daily.map((day, idx) => (
                  <div key={idx} className="forecast-card">
                    <span className="forecast-day">{day.day}</span>
                    <div className="forecast-icon">
                      {getWeatherIcon(day.condition)}
                    </div>
                    <div className="forecast-temps">
                      <span className="temp-high">{day.max}°</span>
                      <span className="temp-low">{day.min}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
};

export default App;
