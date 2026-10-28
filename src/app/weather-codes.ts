// Códigos WMO usados por Open-Meteo: https://open-meteo.com/en/docs#weathervariables

export type Scene = 'clear-day' | 'clear-night' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

interface WeatherCode {
  description: string;
  icon: string;
  nightIcon?: string;
  scene: Exclude<Scene, 'clear-day' | 'clear-night'> | 'clear';
}

const WEATHER_CODES: Record<number, WeatherCode> = {
  0: { description: 'Despejado', icon: '☀️', nightIcon: '🌙', scene: 'clear' },
  1: { description: 'Mayormente despejado', icon: '🌤️', nightIcon: '🌙', scene: 'clear' },
  2: { description: 'Parcialmente nublado', icon: '⛅', nightIcon: '☁️', scene: 'cloudy' },
  3: { description: 'Nublado', icon: '☁️', scene: 'cloudy' },
  45: { description: 'Niebla', icon: '🌫️', scene: 'fog' },
  48: { description: 'Niebla con escarcha', icon: '🌫️', scene: 'fog' },
  51: { description: 'Llovizna ligera', icon: '🌦️', scene: 'rain' },
  53: { description: 'Llovizna', icon: '🌦️', scene: 'rain' },
  55: { description: 'Llovizna intensa', icon: '🌧️', scene: 'rain' },
  56: { description: 'Llovizna helada', icon: '🌧️', scene: 'rain' },
  57: { description: 'Llovizna helada intensa', icon: '🌧️', scene: 'rain' },
  61: { description: 'Lluvia ligera', icon: '🌦️', scene: 'rain' },
  63: { description: 'Lluvia', icon: '🌧️', scene: 'rain' },
  65: { description: 'Lluvia intensa', icon: '🌧️', scene: 'rain' },
  66: { description: 'Lluvia helada', icon: '🌧️', scene: 'rain' },
  67: { description: 'Lluvia helada intensa', icon: '🌧️', scene: 'rain' },
  71: { description: 'Nevada ligera', icon: '🌨️', scene: 'snow' },
  73: { description: 'Nevada', icon: '❄️', scene: 'snow' },
  75: { description: 'Nevada intensa', icon: '❄️', scene: 'snow' },
  77: { description: 'Granos de nieve', icon: '🌨️', scene: 'snow' },
  80: { description: 'Chubascos ligeros', icon: '🌦️', scene: 'rain' },
  81: { description: 'Chubascos', icon: '🌧️', scene: 'rain' },
  82: { description: 'Chubascos violentos', icon: '⛈️', scene: 'storm' },
  85: { description: 'Chubascos de nieve', icon: '🌨️', scene: 'snow' },
  86: { description: 'Chubascos de nieve intensos', icon: '❄️', scene: 'snow' },
  95: { description: 'Tormenta', icon: '⛈️', scene: 'storm' },
  96: { description: 'Tormenta con granizo', icon: '⛈️', scene: 'storm' },
  99: { description: 'Tormenta con granizo intenso', icon: '⛈️', scene: 'storm' },
};

export function weatherDescription(code: number): string {
  return WEATHER_CODES[code]?.description ?? 'Condiciones variables';
}

export function weatherIcon(code: number, isDay = true): string {
  const entry = WEATHER_CODES[code];
  if (!entry) return '🌈';
  return !isDay && entry.nightIcon ? entry.nightIcon : entry.icon;
}

export function weatherScene(code: number, isDay: boolean): Scene {
  const scene = WEATHER_CODES[code]?.scene ?? 'cloudy';
  if (scene === 'clear') return isDay ? 'clear-day' : 'clear-night';
  return scene;
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export function windCardinal(degrees: number): string {
  return CARDINALS[Math.round(degrees / 45) % 8];
}

export function uvLevel(uv: number): string {
  if (uv < 3) return 'Bajo';
  if (uv < 6) return 'Moderado';
  if (uv < 8) return 'Alto';
  if (uv < 11) return 'Muy alto';
  return 'Extremo';
}
