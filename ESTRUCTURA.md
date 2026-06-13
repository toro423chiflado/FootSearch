# Estructura del proyecto

Cada dominio tiene su propia lógica separada.

## Backend (backend/src)

    config/
      postgres.js     conexión a PostgreSQL (pool)
      mongo.js        conexión a MongoDB (mongoose)
      jwt.js          firma/verificación de tokens
    middleware/
      auth.js         requiereAuth + requiereTipo (rol)
      admin.js        requiereAdmin (clave x-admin-key)
      upload.js       multer: subidaVideo + subidaImagenes
    controllers/      (un controlador por dominio)
      authController.js     register / login / refresh / logout / me
      jugadorController.js  listar / detalle / editar perfil / subir imágenes
      clubController.js     listar / detalle / mi club / editar / imágenes / convocatorias
      favoritoController.js listar / alternar favorito
      videoController.js    listar / subir / eliminar video (MongoDB)
      adminController.js    editar estadísticas (privado)
    models/
      MediaJugador.js  esquema Mongoose de videos
    db/
      schema.sql       esquema PostgreSQL (incluye codigos_club + cupo 52)
      seed.js          datos demo + 1000 códigos de club
    routes/
      index.js         todas las rutas, agrupadas por dominio
    server.js          arranque del API

## Frontend (frontend/src)

    components/        piezas reutilizables
      Componentes.jsx  Navbar, Footer, avatares
      Iconos.jsx       emblema (pelota+radar) e iconos SVG
    pages/             una pantalla por archivo
      Landing.jsx
      Auth.jsx             login + registro (estilo Transfermarkt)
      Buscar.jsx           búsqueda de jugadores con filtros
      PerfilJugador.jsx    ver perfil de otro jugador
      MiPerfilJugador.jsx  mi perfil editable (fotos, multimedia, disponibilidad)
      PerfilClub.jsx       ver perfil de un club
      MiClub.jsx           mi club editable (portada, escudo, datos, plantel)
    services/
      api.js           cliente HTTP con refresh automático de tokens
    App.jsx            enrutado por estado + sesión
    main.jsx           punto de entrada
    index.css          estilos

## Bases de datos

- PostgreSQL: usuarios, jugadores, clubes, codigos_club, favoritos, logros,
  convocatorias, refresh_tokens. (Datos relacionales.)
- MongoDB: media_jugadores (videos/highlights). (No relacional.)
- Archivos subidos (imágenes y videos): backend/uploads (volumen persistente).
