# Cómo correr FootSearch (paso a paso)

## ⭐ Forma recomendada: TODO en Docker

Con esto el backend, Postgres y Mongo corren juntos, y los datos PERSISTEN.

```bash
cd FootSearch
docker compose up -d --build
```

Eso es todo para el backend. El contenedor:
- Crea las bases de datos.
- Siembra automáticamente los datos demo SOLO la primera vez (si la base
  está vacía). En arranques posteriores NO borra nada: tus datos persisten.

Luego el frontend:

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

### ¿Cómo sé que el backend está vivo?
```bash
curl http://localhost:4000/api/health
# debe responder: {"ok":true,"servicio":"footsearch-api"}
```

---

## Sobre los datos y el seed (IMPORTANTE)

Hay dos comandos distintos. Entiende la diferencia:

| Comando | Qué hace |
|---|---|
| `npm run seed`        | SEGURO. Solo siembra si la base está vacía. **No borra** datos existentes. |
| `npm run seed:reset`  | REINICIA. Borra todo y vuelve a sembrar desde cero. Úsalo solo si quieres empezar limpio. |

Dentro de Docker, el seed automático del arranque equivale a `npm run seed`
(seguro). Por eso **tus datos persisten** entre reinicios: solo se siembra
cuando la base está realmente vacía.

### ¿Cuándo se borran los datos?
Solo si tú lo pides explícitamente:
- `docker compose down -v`  (la `-v` borra los volúmenes = borra datos)
- `npm run seed:reset`

Con `docker compose down` (sin `-v`) o al apagar el PC, los datos se conservan.

---

## ⚠️ El error "autentificación password falló para footsearch"

Ese error aparece cuando corres el backend EN LOCAL (npm run dev en backend/)
y el archivo `backend/.env` no tiene las credenciales correctas.

**La solución más simple: NO corras el backend en local.** Déjalo en Docker
(ya corre con `docker compose up -d`). Solo corre el frontend con `npm run dev`.

Si de todas formas quieres correr el backend en local:
1. Levanta solo las bases:  `docker compose up -d postgres mongo`
2. Crea el .env:  `cd backend && cp .env.example .env`
3. Asegúrate de que `backend/.env` tenga `PG_HOST=localhost` (NO `postgres`).
4. `npm install && npm run seed && npm run dev`

---

## Usuarios de prueba (contraseña: demo1234)

Ver USUARIOS.md. Resumen:
- Clubes:  atletico.condores@demo.pe, deportivo.manglar@demo.pe,
           union.amazonica@demo.pe, real.altiplano@demo.pe
- Jugadores: diego@demo.pe, luis@demo.pe, andres@demo.pe, joaquin@demo.pe
- Cazatalentos: scout@demo.pe

## Licencias de club
Ver LICENCIAS.md (100 licencias fijas + ~900 aleatorias). Para listar libres:
```bash
curl "http://localhost:4000/api/admin/licencias?estado=libres&limit=100" \
  -H "x-admin-key: TU_CLAVE_ADMIN"
```
