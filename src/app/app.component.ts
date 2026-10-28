import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { ForecastDay, Place, WeatherResponse } from './weather.models';
import { WeatherService } from './weather.service';
import { uvLevel, weatherDescription, weatherIcon, weatherScene, windCardinal } from './weather-codes';

type Status = 'loading' | 'ready' | 'error';

const RECENT_KEY = 'weatherApp.recent';
const LAST_PLACE_KEY = 'weatherApp.lastPlace';
const MAX_RECENT = 6;
const DEFAULT_PLACE: Place = { name: 'Madrid', latitude: 40.4165, longitude: -3.70256, admin1: 'Madrid', country: 'España' };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [DatePipe, DecimalPipe],
  host: { '[attr.data-scene]': 'scene()' },
})
export class AppComponent implements OnInit {
  private weatherService = inject(WeatherService);
  private destroyRef = inject(DestroyRef);

  private query$ = new Subject<string>();
  private load$ = new Subject<Place>();
  protected retryAction: (() => void) | null = null;

  readonly query = signal('');
  readonly suggestions = signal<Place[]>([]);
  readonly suggestionsOpen = signal(false);
  readonly activeIndex = signal(-1);

  readonly place = signal<Place | null>(null);
  readonly weather = signal<WeatherResponse | null>(null);
  readonly status = signal<Status>('loading');
  readonly errorMessage = signal('');
  readonly locating = signal(false);
  readonly recent = signal<Place[]>(this.readStorage<Place[]>(RECENT_KEY) ?? []);

  readonly isDay = computed(() => (this.weather()?.current.is_day ?? 1) === 1);
  readonly scene = computed(() => {
    const current = this.weather()?.current;
    return current ? weatherScene(current.weather_code, this.isDay()) : 'clear-day';
  });

  readonly placeSubtitle = computed(() => {
    const place = this.place();
    return place ? this.placeMeta(place) : '';
  });

  /** Fecha y hora local del lugar consultado (no la del navegador). */
  readonly localTime = computed(() => {
    const time = this.weather()?.current.time;
    return time ? parseLocalDateTime(time) : null;
  });

  readonly forecast = computed<ForecastDay[]>(() => {
    const daily = this.weather()?.daily;
    if (!daily) return [];
    return daily.time.map((day, i) => ({
      date: parseLocalDateTime(day),
      code: daily.weather_code[i],
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      precipitation: daily.precipitation_sum[i],
      precipitationProbability: daily.precipitation_probability_max[i],
    }));
  });

  private readonly weekRange = computed(() => {
    const days = this.forecast();
    const min = Math.min(...days.map(d => d.min));
    const max = Math.max(...days.map(d => d.max));
    return { min, span: Math.max(max - min, 1) };
  });

  readonly today = computed(() => {
    const daily = this.weather()?.daily;
    if (!daily) return null;
    const uv = daily.uv_index_max[0];
    return {
      max: daily.temperature_2m_max[0],
      min: daily.temperature_2m_min[0],
      precipitation: daily.precipitation_sum[0],
      precipitationProbability: daily.precipitation_probability_max[0],
      sunrise: daily.sunrise[0].slice(11, 16),
      sunset: daily.sunset[0].slice(11, 16),
      uv,
      uvLabel: uv === null ? '' : uvLevel(uv),
    };
  });

  readonly icon = weatherIcon;
  readonly description = weatherDescription;
  readonly cardinal = windCardinal;

  constructor() {
    this.query$
      .pipe(
        debounceTime(250),
        map(q => q.trim()),
        distinctUntilChanged(),
        switchMap(q => this.weatherService.searchPlaces(q).pipe(catchError(() => of([])))),
        takeUntilDestroyed(),
      )
      .subscribe(results => {
        this.suggestions.set(results);
        this.activeIndex.set(-1);
      });

    // switchMap cancela la petición anterior si el usuario cambia de ciudad rápido.
    this.load$
      .pipe(
        tap(() => {
          this.status.set('loading');
          this.errorMessage.set('');
        }),
        switchMap(place =>
          this.weatherService.getForecast(place).pipe(
            map(weather => ({ place, weather })),
            catchError(() => of({ place, weather: null })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ place, weather }) => {
        if (!weather) {
          this.fail('No se pudieron recuperar los datos del tiempo.', () => this.loadPlace(place));
          return;
        }
        this.place.set(place);
        this.weather.set(weather);
        this.status.set('ready');
        this.writeStorage(LAST_PLACE_KEY, place);
      });
  }

  ngOnInit(): void {
    this.loadPlace(this.readStorage<Place>(LAST_PLACE_KEY) ?? DEFAULT_PLACE);
  }

  // --- Búsqueda -------------------------------------------------------------

  onQueryInput(value: string): void {
    this.query.set(value);
    this.suggestionsOpen.set(true);
    this.query$.next(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;
    switch (event.key) {
      case 'ArrowDown':
        if (!count) return;
        event.preventDefault();
        this.suggestionsOpen.set(true);
        this.activeIndex.update(i => (i + 1) % count);
        break;
      case 'ArrowUp':
        if (!count) return;
        event.preventDefault();
        this.activeIndex.update(i => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Escape':
        this.suggestionsOpen.set(false);
        break;
    }
  }

  onSubmit(event?: Event): void {
    event?.preventDefault();
    const active = this.suggestions()[this.activeIndex()];
    if (active && this.suggestionsOpen()) {
      this.selectPlace(active);
      return;
    }

    const q = this.query().trim();
    if (!q) return;

    this.suggestionsOpen.set(false);
    this.status.set('loading');
    this.weatherService.searchPlaces(q, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([first]) => first
          ? this.selectPlace(first)
          : this.fail(`No encontramos «${q}». Revisa el nombre e inténtalo de nuevo.`, null),
        error: () => this.fail('Error al buscar la ciudad. Comprueba tu conexión.', () => this.onSubmit()),
      });
  }

  selectPlace(place: Place): void {
    this.query.set('');
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
    this.addRecent(place);
    this.loadPlace(place);
  }

  closeSuggestionsSoon(): void {
    // Deja que el click sobre una sugerencia se procese antes de ocultarla.
    setTimeout(() => this.suggestionsOpen.set(false), 150);
  }

  useMyLocation(): void {
    if (!('geolocation' in navigator)) {
      this.fail('Tu navegador no permite obtener la ubicación.', null);
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.locating.set(false);
        this.loadPlace({ name: 'Tu ubicación', latitude: coords.latitude, longitude: coords.longitude });
      },
      () => {
        this.locating.set(false);
        this.fail('No se pudo obtener tu ubicación. Revisa los permisos del navegador.', () => this.useMyLocation());
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  retry(): void {
    this.retryAction?.();
  }

  private loadPlace(place: Place): void {
    this.load$.next(place);
  }

  private fail(message: string, retryAction: (() => void) | null): void {
    this.errorMessage.set(message);
    this.retryAction = retryAction;
    this.status.set('error');
  }

  placeMeta(place: Place): string {
    return [place.admin1, place.country]
      .filter((part, i, parts) => part && part !== place.name && parts.indexOf(part) === i)
      .join(', ');
  }

  // --- Previsión ------------------------------------------------------------

  rangeStyle(day: ForecastDay): { left: string; width: string } {
    const { min, span } = this.weekRange();
    return {
      left: `${((day.min - min) / span) * 100}%`,
      width: `${Math.max(((day.max - day.min) / span) * 100, 4)}%`,
    };
  }

  // --- Búsquedas recientes --------------------------------------------------

  isCurrent(place: Place): boolean {
    const current = this.place();
    return !!current && placeKey(current) === placeKey(place);
  }

  removeRecent(place: Place): void {
    this.recent.update(list => list.filter(p => placeKey(p) !== placeKey(place)));
    this.writeStorage(RECENT_KEY, this.recent());
  }

  private addRecent(place: Place): void {
    const { name, latitude, longitude, admin1, country } = place;
    this.recent.update(list =>
      [{ name, latitude, longitude, admin1, country }, ...list.filter(p => placeKey(p) !== placeKey(place))]
        .slice(0, MAX_RECENT),
    );
    this.writeStorage(RECENT_KEY, this.recent());
  }

  private readStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sin almacenamiento (modo privado, cuota llena…): la app sigue funcionando.
    }
  }
}

function placeKey(place: Place): string {
  return `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
}

/** Interpreta "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm" como hora local, sin desfase UTC. */
function parseLocalDateTime(value: string): Date {
  const [date, time = '00:00'] = value.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}
