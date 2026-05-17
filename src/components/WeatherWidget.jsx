import { useEffect, useState } from 'react'

// BOM geohash for Mount Beauty, VIC (-36.733, 147.167)
const MT_BEAUTY_GEOHASH = 'r1kkm'

function WeatherIcon({ code }) {
  const map = {
    sunny: '☀️', clear: '🌙', 'mostly-sunny': '⛅',
    'partly-cloudy': '⛅', cloudy: '☁️', overcast: '☁️',
    rain: '🌧️', 'light-rain': '🌦️', drizzle: '🌦️',
    storm: '⛈️', snow: '❄️', fog: '🌫️', wind: '💨',
  }
  const icon = Object.entries(map).find(([k]) => code?.toLowerCase().includes(k))?.[1] ?? '🌤️'
  return <span className="text-4xl">{icon}</span>
}

export default function WeatherWidget() {
  const [obs, setObs] = useState(null)
  const [forecast, setForecast] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    const base = 'https://api.weather.bom.gov.au/v1/locations'
    Promise.all([
      fetch(`${base}/${MT_BEAUTY_GEOHASH}/observations`).then(r => r.json()),
      fetch(`${base}/${MT_BEAUTY_GEOHASH}/forecasts/daily`).then(r => r.json()),
    ])
      .then(([obsData, fcData]) => {
        setObs(obsData.data)
        setForecast(fcData.data?.slice(0, 4) ?? [])
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="bg-green-club/10 border border-green-club/20 rounded-xl p-4 text-center text-sm text-gray-500">
        Weather data unavailable – check{' '}
        <a href="http://www.bom.gov.au" target="_blank" rel="noreferrer" className="underline">
          bom.gov.au
        </a>
      </div>
    )
  }

  if (!obs) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-xl h-36" />
    )
  }

  const temp = obs.temp?.toFixed(1)
  const feels = obs.temp_feels_like?.toFixed(1)
  const rain = obs.rain_since_9am?.toFixed(1)
  const wind = obs.wind?.speed_kilometre
  const windDir = obs.wind?.direction
  const humidity = obs.humidity
  const desc = obs.short_text ?? ''

  return (
    <div className="bg-green-club rounded-xl p-5 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gold text-xs font-semibold uppercase tracking-widest mb-1">
            Mt Beauty — Live Weather
          </p>
          <p className="text-3xl font-bold">{temp}°C</p>
          <p className="text-green-light text-sm">Feels like {feels}°C · {desc}</p>
        </div>
        <WeatherIcon code={desc} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-green-mid pt-3">
        <div>
          <p className="text-gold font-semibold">{humidity}%</p>
          <p className="text-green-light">Humidity</p>
        </div>
        <div>
          <p className="text-gold font-semibold">{wind} km/h {windDir}</p>
          <p className="text-green-light">Wind</p>
        </div>
        <div>
          <p className="text-gold font-semibold">{rain} mm</p>
          <p className="text-green-light">Rain today</p>
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-1 border-t border-green-mid pt-3">
          {forecast.map((day, i) => {
            const d = new Date(day.date)
            const label = i === 0 ? 'Today' : d.toLocaleDateString('en-AU', { weekday: 'short' })
            return (
              <div key={day.date} className="text-center text-xs">
                <p className="text-green-light">{label}</p>
                <WeatherIcon code={day.short_text ?? ''} />
                <p className="font-semibold">{day.temp_max?.toFixed(0)}°</p>
                <p className="text-green-light">{day.temp_min?.toFixed(0)}°</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
