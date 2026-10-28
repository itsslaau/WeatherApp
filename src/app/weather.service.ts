import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Place, WeatherResponse } from './weather.models';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);

  searchPlaces(query: string, count = 5): Observable<Place[]> {
    const name = query.trim();
    if (name.length < 2) return of([]);

    const params = new HttpParams()
      .set('name', name)
      .set('count', count)
      .set('language', 'es')
      .set('format', 'json');

    return this.http
      .get<{ results?: Place[] }>(GEOCODING_URL, { params })
      .pipe(map(response => response.results ?? []));
  }

  getForecast(place: Place): Observable<WeatherResponse> {
    const params = new HttpParams()
      .set('latitude', place.latitude)
      .set('longitude', place.longitude)
      .set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code,is_day')
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max')
      .set('forecast_days', 7)
      .set('timezone', 'auto');

    return this.http.get<WeatherResponse>(FORECAST_URL, { params });
  }
}
