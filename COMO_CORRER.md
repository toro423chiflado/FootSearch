# Cómo correr

## Arranque

    docker compose down -v
    docker compose up -d --build

Espera ~20s. Esto levanta el backend, Postgres y Mongo.

## Si no hay datos, fuerza el seed

    docker exec -it footsearch_backend npm run seed:reset

Crea 4 clubes, jugadores, un scout y 1000 licencias.

Verifica:

    docker exec -it footsearch_postgres psql -U footsearch -d footsearch -c "SELECT count(*) FROM codigos_club;"

Debe dar 1000.

## Frontend

    cd frontend
    rm -rf dist node_modules/.vite
    npm install
    npm run dev

Abre http://localhost:5173 y recarga con Ctrl+Shift+R.

## Notas

- No corras el backend con `npm` aparte: ya está en Docker. Si lo haces, da
  error de contraseña.
- `npm run seed` no borra datos (solo siembra si está vacío).
  `npm run seed:reset` borra y vuelve a sembrar.
- Los datos persisten salvo que uses `docker compose down -v`.

## Usuarios de prueba (clave: demo1234)

- Clubes: atletico.condores@demo.pe, deportivo.manglar@demo.pe, union.amazonica@demo.pe, real.altiplano@demo.pe
- Jugadores: diego@demo.pe, luis@demo.pe, andres@demo.pe, joaquin@demo.pe
- Scout: scout@demo.pe

Admin (Postman): ver ADMIN.md. Licencias: ver LICENCIAS.md.
