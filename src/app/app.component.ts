import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  time: string;
}

interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  precipitation_sum: number[];
}

interface WeatherResponse {
  current: CurrentWeather;
  daily: DailyForecast;
  timezone: string;
}

type WeatherCode = { description: string; icon: string };

@Component({
  selector: 'app-root',
  standalone: true,  
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [FormsModule, CommonModule, MatIconModule]  
})
export class AppComponent implements OnInit {  

  city: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  weatherData: WeatherResponse | null = null;
  tempMin: string = '';
  tempMax: string = '';
  currentTemperature: string = '';
  weatherIcon: string = '';
  
  // ✅ AÑADIDO: Propiedad recentSearches que faltaba
  recentSearches: string[] = [];

  // Weather code mapping
  private weatherCodes: Record<number, WeatherCode> = {
    0: { description: "Cielo despejado", icon: "☀️" },
    1: { description: "Principalmente despejado", icon: "🌤️" },
    2: { description: "Parcialmente nublado", icon: "⛅" },
    3: { description: "Nublado", icon: "☁️" },
    45: { description: "Niebla", icon: "🌫️" },
    48: { description: "Niebla con escarcha", icon: "🌫️" },
    51: { description: "Llovizna ligera", icon: "🌦️" },
    53: { description: "Llovizna moderada", icon: "🌦️" },
    55: { description: "Llovizna intensa", icon: "🌧️" },
    61: { description: "Lluvia ligera", icon: "🌧️" },
    63: { description: "Lluvia moderada", icon: "🌧️" },
    65: { description: "Lluvia intensa", icon: "⛈️" },
    71: { description: "Nieve ligera", icon: "🌨️" },
    73: { description: "Nieve moderada", icon: "❄️" },
    75: { description: "Nieve intensa", icon: "❄️" },
    95: { description: "Tormenta", icon: "⛈️" },
    96: { description: "Tormenta con granizo ligero", icon: "⛈️" },
    99: { description: "Tormenta con granizo intenso", icon: "⛈️" }
  };

  constructor(private http: HttpClient) {
    // ✅ CORREGIDO: Cargar búsquedas recientes
    this.loadRecentSearches();
  }

  // ✅ AÑADIDO: ngOnInit lifecycle hook
  ngOnInit(): void {
    // Carga Madrid por defecto al iniciar
    this.searchCity('Madrid');
  }

  searchCity(cityName: string) {
    this.city = cityName;
    this.getCoordinates(cityName);
    // ✅ AÑADIDO: Guardar en búsquedas recientes
    this.addToRecentSearches(cityName);
  }

  getCoordinates(city: string) {
    if (!city.trim()) {
      this.errorMessage = 'Introduce una ciudad.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';  // ✅ Limpiar error anterior
    
    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;

    this.http.get<{ results: GeocodingResult[] }>(apiUrl).subscribe({
      next: (response) => {
        if (response.results && response.results.length) {
          const cityObj = response.results[0];
          this.fetchWeather(cityObj.latitude, cityObj.longitude);
        } else {
          this.loading = false;
          this.errorMessage = 'Ciudad no encontrada.';
          this.weatherData = null;
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error en la búsqueda de la ciudad.';
      }
    });
  }

  fetchWeather(lat: number, lon: number) {
    // ✅ CORREGIDO: API URL actualizada
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&forecast_days=7&timezone=auto`;
    
    this.http.get<WeatherResponse>(apiUrl).subscribe({
      next: (data) => {
        this.loading = false;
        this.weatherData = data;
        this.updateWeather(data);
        this.errorMessage = '';
      },
      error: () => {
        this.loading = false;
        this.weatherData = null;
        this.errorMessage = 'No se pudieron recuperar los datos del tiempo.';
      }
    });
  }

  updateWeather(data: WeatherResponse) {
    // Temperatura actual
    this.currentTemperature = `${Math.round(data.current.temperature_2m)}°C`;
    // Temp máxima/mínima para hoy
    this.tempMax = `${Math.round(data.daily.temperature_2m_max[0])}°C`;
    this.tempMin = `${Math.round(data.daily.temperature_2m_min[0])}°C`;
    // Icono según weather_code
    const code = data.current.weather_code;
    this.weatherIcon = this.weatherCodes[code]?.icon || '🌈';
  }

  // ✅ AÑADIDO: Método que faltaba
  getWeatherDescription(weatherCode: number): string {
    return this.weatherCodes[weatherCode]?.description || 'Condiciones variables';
  }

  onSearch() {
    if (this.city.trim()) {
      this.getCoordinates(this.city);
      this.addToRecentSearches(this.city);
    }
  }

  // ✅ AÑADIDO: Métodos para búsquedas recientes
  private addToRecentSearches(city: string): void {
    const trimmedCity = city.trim();
    if (trimmedCity && !this.recentSearches.includes(trimmedCity)) {
      this.recentSearches.unshift(trimmedCity);
      this.recentSearches = this.recentSearches.slice(0, 5); // Mantener solo las últimas 5
      this.saveRecentSearches();
    }
  }

  private loadRecentSearches(): void {
    try {
      const saved = localStorage.getItem('recentWeatherSearches');
      if (saved) {
        this.recentSearches = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error cargando búsquedas recientes:', error);
      this.recentSearches = [];
    }
  }

  private saveRecentSearches(): void {
    try {
      localStorage.setItem('recentWeatherSearches', JSON.stringify(this.recentSearches));
    } catch (error) {
      console.error('Error guardando búsquedas recientes:', error);
    }
  }
}
