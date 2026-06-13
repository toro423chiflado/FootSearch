# FootSearch

Plataforma de scouting de futbol estilo "LinkedIn del futbol" para Peru.
Conecta jugadores, cazatalentos y clubes. Incluye frontend (React + Vite),
backend (Node + Express) con autenticacion JWT, y dos bases de datos en Docker:
PostgreSQL (relacional) y MongoDB (no relacional, para videos/highlights).

## Estructura

    footsearch-app/
      docker-compose.yml      Levanta PostgreSQL + MongoDB
      backend/                API REST (Node + Express)
        src/
          server.js           Punto de entrada
          config/             Conexiones PG, Mongo y JWT
          controllers/        Logica de auth, jugadores, clubes, favoritos, videos
          routes/             Definicion de endpoints
          middleware/         Auth (JWT) y subida de archivos (multer)
          models/             Modelo Mongoose (videos)
          db/
            schema.sql        Esquema PostgreSQL (se aplica solo en Docker)
            seed.js           Carga datos de prueba
      frontend/               App React (Vite)
        src/
          App.jsx             Enrutado + sesion
          api.js              Cliente HTTP con refresh de tokens
          Auth.jsx            Login y registro (3 tipos de usuario)
          Buscar.jsx          Busqueda con filtros
          PerfilJugador.jsx   Perfil deportivo
          PerfilClub.jsx      Perfil de club + plantel
          Iconos.jsx          Emblema e iconos SVG

## Puesta en marcha (paso a paso)

Requisitos: Docker + Docker Compose, y Node.js 18+ (solo para el frontend).

### Opción A — Todo en Docker (recomendada, con datos persistentes)

```bash
cd footsearch-app
cp .env.example .env              # ajusta credenciales / JWT si quieres
docker compose up -d --build      # levanta Postgres + Mongo + backend
```

- Postgres (5432), Mongo (27017) y el backend/API (4000) quedan corriendo.
- La primera vez siembra datos demo automáticamente (solo si la BD está vacía).
- Los datos persisten en volúmenes aunque apagues o actualices los contenedores.

Luego el frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                       # app en http://localhost:5173
```

Para todo lo relacionado con persistencia y Docker Hub, ver **DOCKER.md**.

### Opción B — Backend en local (sin dockerizar el backend)

Solo levanta las bases de datos en Docker y corre el backend con Node directo.
Útil para desarrollar el backend con recarga rápida.

    cd footsearch-app
    docker compose up -d postgres mongo   # solo las dos BDs

Esto crea PostgreSQL (puerto 5432) y MongoDB (puerto 27017). El esquema SQL
se aplica automaticamente la primera vez.

### 2. Backend

    cd backend
    cp .env.example .env        # aquí los hosts son localhost (no postgres/mongo)
    npm install
    npm run seed                # carga clubes y jugadores de prueba
    npm run dev                 # API en http://localhost:4000

### 3. Frontend

    cd ../frontend
    cp .env.example .env
    npm install
    npm run dev                 # app en http://localhost:5173

Abre http://localhost:5173

## Cuentas de prueba (tras `npm run seed`)

- Cazatalentos: `scout@footsearch.pe` / `demo1234`
- Jugadores (todos con `demo1234`), por ejemplo: `diego.quispe@footsearch.pe`
- IDs de club validos para registrar una cuenta de club: `FS-001` ... `FS-006`

## Endpoints principales

Auth:
- POST `/api/auth/register`   crear cuenta (jugador | cazatalentos | club)
- POST `/api/auth/login`      iniciar sesion -> accessToken + refreshToken
- POST `/api/auth/refresh`    renovar el access token
- POST `/api/auth/logout`     cerrar sesion (revoca el refresh token)
- GET  `/api/auth/me`         perfil del usuario autenticado

Jugadores:
- GET  `/api/jugadores`               buscar/filtrar (q, posicion, disponible, nivel)
- GET  `/api/jugadores/:id`           perfil + logros + videos
- PUT  `/api/jugadores/me`            editar mi perfil (solo jugador)
- POST `/api/jugadores/me/videos`     subir video (multipart, solo jugador)
- GET  `/api/jugadores/:id/videos`    listar videos

Clubes:
- GET  `/api/clubes`                  listar clubes
- GET  `/api/clubes/:id`              club + plantel + convocatorias
- POST `/api/clubes/convocatorias`    crear convocatoria (solo club)

Favoritos (cazatalentos y club):
- GET  `/api/favoritos`               mis favoritos
- POST `/api/favoritos/:jugadorId`    marcar / quitar favorito

## Seguridad y reglas de negocio

- Contrasenas hasheadas con bcrypt.
- Tokens JWT: access (corto) + refresh (largo, con rotacion y revocacion en BD).
- Autorizacion por rol: ej. un jugador no puede acceder a favoritos.
- Registro de club exige un ID verificado (codigo de la tabla `clubes`).
- Limite de 52 jugadores por club, garantizado con un trigger en PostgreSQL.
- La edad se calcula a partir de la fecha de nacimiento.

## Notas

- Los videos se guardan en MongoDB (metadatos) y el archivo en `backend/uploads/`.
- En produccion: usa un JWT_SECRET largo y aleatorio, HTTPS y un almacenamiento
  de archivos dedicado (S3 o similar) en lugar del disco local.
