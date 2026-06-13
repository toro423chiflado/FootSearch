# Endpoint de administración (privado)

Las estadísticas de los jugadores (partidos, goles, asistencias, minutos) NO
las puede editar el propio jugador. Arrancan en 0 y solo se cambian con la
clave de administración que solo tú tienes.

## Configurar tu clave

En el `.env` (raíz, para docker) o `backend/.env` define:

    ADMIN_KEY=pon_aqui_una_clave_larga_y_secreta

Genera una segura con:  `openssl rand -hex 24`

## Listar jugadores (para obtener sus IDs)

    curl http://localhost:4000/api/admin/jugadores \
      -H "x-admin-key: TU_CLAVE"

Devuelve id, nombre y estadísticas actuales de cada jugador.

## Editar estadísticas de un jugador

    curl -X PUT http://localhost:4000/api/admin/jugadores/ID_DEL_JUGADOR/estadisticas \
      -H "Content-Type: application/json" \
      -H "x-admin-key: TU_CLAVE" \
      -d '{"partidos": 20, "goles": 15, "asistencias": 7, "minutos": 1700}'

- Puedes enviar solo los campos que quieras cambiar.
- Sin la cabecera `x-admin-key` correcta, responde 401 (nadie más puede tocarlas).

## Códigos de club (IDs de un solo uso)

El seed genera 1000 códigos con formato `FS-XXXX-XXXX-XXXX`. Para ver los
disponibles directamente en la base de datos:

    -- dentro de psql / el contenedor de postgres
    SELECT codigo FROM codigos_club WHERE usado = false LIMIT 20;

Cada código sirve una sola vez: al registrar un club queda marcado como usado
y crea el club automáticamente. Si alguien intenta reutilizarlo, recibe error.
