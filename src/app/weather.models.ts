export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  is_day: number;
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: (number | null)[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: (number | null)[];
}

export interface WeatherResponse {
  timezone: string;
  current: CurrentWeather;
  daily: DailyForecast;
}

export interface ForecastDay {
  date: Date;
  code: number;
  max: number;
  min: number;
  precipitation: number;
  precipitationProbability: number | null;
}
