import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { weatherIcon, weatherScene, windCardinal } from './weather-codes';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('carga Madrid por defecto al iniciar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(r => r.url.includes('/v1/forecast'));
    expect(req.request.params.get('latitude')).toBe('40.4165');
    expect(fixture.componentInstance.status()).toBe('loading');
  });
});

describe('weather-codes', () => {
  it('usa icono de noche cuando está despejado de noche', () => {
    expect(weatherIcon(0, false)).toBe('🌙');
    expect(weatherScene(0, false)).toBe('clear-night');
  });

  it('convierte grados en punto cardinal', () => {
    expect(windCardinal(0)).toBe('N');
    expect(windCardinal(225)).toBe('SO');
    expect(windCardinal(350)).toBe('N');
  });
});
