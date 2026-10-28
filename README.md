# WeatherApp
# [26-01-2025] Primera versión (1.0.0)
# [01-09-2025] Segunda versión (2.0.0)
# [17-10-2026] Tercera versión (3.0.0)
---

Aplicación Angular para consultar el tiempo actual y la previsión de 7 días de cualquier ciudad, con datos de [Open-Meteo](https://open-meteo.com/) (no necesita clave de API ni backend).

### Novedades de la 3.0.0
- Buscador con autocompletado de ciudades (navegable con teclado) y botón «Usar mi ubicación».
- Previsión de 7 días con barras de rango de temperatura y probabilidad de lluvia.
- Nuevos datos: sensación térmica real, dirección del viento, índice UV, amanecer y atardecer.
- Fondo que cambia según el tiempo y si es de día o de noche, en la hora local de la ciudad.
- Búsquedas recientes que se pueden quitar, y se recuerda la última ciudad consultada.
- Limpieza: sin backend ni dependencias sin uso (Material, ngx-translate, axios, redis…).

## Pasos para compilar y ejecutar la aplicación (Español)

1. Clona el repositorio y entra en la carpeta del proyecto:
   ```sh
   git clone <URL-del-repositorio>
   cd WeatherApp
   ```
2. Instala las dependencias:
   ```sh
   npm install
   ```
3. Arranca la aplicación:
   ```sh
   npm start
   ```
4. Abre tu navegador en `http://localhost:4200`.

---

## Steps to build and run the application (English)

Angular app showing current weather and a 7-day forecast for any city, using [Open-Meteo](https://open-meteo.com/) data (no API key or backend required).

1. Clone the repository and enter the project folder:
   ```sh
   git clone <repository-URL>
   cd WeatherApp
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the application:
   ```sh
   npm start
   ```
4. Open your browser at `http://localhost:4200`.
