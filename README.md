# FootSearch ⚽

Plataforma de scouting para jóvenes promesas en el fútbol peruano.
Conecta jugadores, cazatalentos y clubes. Incluye frontend (React + Vite),
backend (Node + Express) con autenticacion JWT, y dos bases de datos en Docker:
PostgreSQL y MongoDB.

## Estructura

    footsearch-app/
      docker-compose.yml      Levanta PostgreSQL + MongoDB
      backend/                API REST 
        src/
          server.js           Punto de entrada
          config/             Conexiones PG, Mongo y JWT
          controllers/        Logica de auth, jugadores, clubes, favoritos, videos
          routes/             Definicion de endpoints
          middleware/         Auth y subida de archivos 
          models/             Modelo Mongoose 
          db/
            schema.sql        Esquema PostgreSQL 
            seed.js           Carga datos de prueba
      frontend/               App React
        src/
          App.jsx             Enrutado + sesion
          api.js              Cliente HTTP con refresh de tokens
          Auth.jsx            Login y registro 
          Buscar.jsx          Busqueda con filtros
          PerfilJugador.jsx   Perfil deportivo
          PerfilClub.jsx      Perfil de club + plantel
          Iconos.jsx          Emblema e iconos SVG

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
