# Administrador

## Configurar tu clave

El backend corre en Docker, así que lee la clave del archivo `.env` de la
**raíz** del proyecto (NO de `backend/.env`).

1. En la raíz del proyecto, crea o edita `.env`:

       ADMIN_KEY=mi_clave_secreta_123

2. Reinicia el contenedor para que tome el cambio:

       docker compose up -d --force-recreate backend

3. Comprueba que quedó bien:

       docker exec footsearch_backend printenv ADMIN_KEY

   Debe imprimir tu clave.

## Entrar desde Postman (paso a paso)

1. Method: `GET`
2. URL: `http://localhost:4000/api/admin/usuarios`
3. Pestaña **Headers** → agrega una fila:
   - Key: `x-admin-key`
   - Value: `mi_clave_secreta_123`  (tu clave, exacta, sin espacios)
4. **Send**. Debe devolver la lista de usuarios.

Si da 401: la clave del header no coincide con la del servidor (paso 3 de arriba).
Si da 500 "ADMIN_KEY no configurada": no reiniciaste el contenedor.

## Comandos

Cambia `CLAVE` por tu clave y los `ID_*` por los que obtengas al listar.

Listar usuarios:
    GET http://localhost:4000/api/admin/usuarios
    GET http://localhost:4000/api/admin/usuarios?tipo=jugador
    GET http://localhost:4000/api/admin/usuarios?tipo=club
    GET http://localhost:4000/api/admin/usuarios?tipo=cazatalentos

Listar clubes / jugadores / licencias:
    GET http://localhost:4000/api/admin/clubes
    GET http://localhost:4000/api/admin/jugadores
    GET http://localhost:4000/api/admin/licencias?estado=libres&limit=100

Editar estadísticas:
    PUT http://localhost:4000/api/admin/jugadores/ID_JUGADOR/estadisticas
    Body (raw JSON): {"partidos":20,"goles":15,"asistencias":7,"minutos":1700}

Logros:
    GET    http://localhost:4000/api/admin/jugadores/ID_JUGADOR/logros
    POST   http://localhost:4000/api/admin/jugadores/ID_JUGADOR/logros   Body: {"titulo":"Campeón 2025"}
    DELETE http://localhost:4000/api/admin/logros/ID_LOGRO

Eliminar:
    DELETE http://localhost:4000/api/admin/usuarios/ID_USUARIO
    DELETE http://localhost:4000/api/admin/clubes/ID_CLUB

> Todas las peticiones llevan el header `x-admin-key: TU_CLAVE`.
> Para POST y PUT: Body → raw → JSON.
