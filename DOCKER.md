# Docker, persistencia y Docker Hub — FootSearch

Esta guía responde a una duda muy común: **¿cómo hago que mi app se distribuya
por Docker Hub y que los datos NO se borren al actualizar?**

## La idea en una frase

> La **imagen** (Docker Hub) lleva el **código**. Los **datos** viven en
> **volúmenes**, que están en el disco, separados de la imagen. Por eso puedes
> actualizar la imagen mil veces y los datos siguen ahí.

```
  Docker Hub                Tu servidor / PC
 ┌──────────┐   pull      ┌─────────────────────────────┐
 │  imagen  │ ─────────►  │  contenedor (código)        │
 │ (código) │             │     │                       │
 └──────────┘             │     ▼                       │
                          │  volumen  ◄── datos AQUÍ     │
                          │ (pg_data, mongo_data,        │
                          │  uploads_data)               │
                          └─────────────────────────────┘
```

Actualizar la imagen reemplaza el contenedor, **no** el volumen.

---

## Uso local (lo que tienes ahora)

Todo se levanta con un comando. Los datos persisten en volúmenes de Docker.

```bash
cd footsearch-app
cp .env.example .env        # ajusta credenciales / JWT si quieres
docker compose up -d --build
```

- Postgres → puerto 5432
- Mongo → puerto 27017
- Backend (API) → puerto 4000
- Frontend: por ahora se corre aparte con `cd frontend && npm run dev`
  (apuntando a `http://localhost:4000/api`).

La primera vez, si `SEED_ON_START=true`, el backend siembra datos demo
**solo si la base está vacía**. Nunca borra datos existentes.

### Comandos del día a día

```bash
docker compose ps                 # ver estado
docker compose logs -f backend    # ver logs del API
docker compose stop               # apagar SIN borrar datos
docker compose up -d              # volver a encender (datos intactos)
docker compose down               # quita contenedores, CONSERVA volúmenes/datos
docker compose down -v            # ⚠️ BORRA TAMBIÉN LOS DATOS (cuidado)
```

La diferencia clave: `down` conserva tus datos, `down -v` los elimina.

---

## Probar que los datos persisten

```bash
docker compose up -d --build
# … crea una cuenta o sube datos desde la app …
docker compose down               # apaga y elimina contenedores
docker compose up -d              # vuelve a levantar
# Tus cuentas y datos SIGUEN AHÍ porque los volúmenes no se tocaron.
```

---

## Distribuir tu backend por Docker Hub

Solo tu **backend** se sube como imagen. Postgres y Mongo usan imágenes
oficiales (no las construyes tú).

### 1. Crear cuenta y repositorio en Docker Hub
- Regístrate en https://hub.docker.com
- El repositorio será `TU_USUARIO/footsearch-backend`.

### 2. Construir y subir la imagen (manual)

```bash
# inicia sesión una vez
docker login

# construye la imagen desde la carpeta backend
docker build -t TU_USUARIO/footsearch-backend:latest ./backend

# (opcional) etiqueta también una versión concreta
docker build -t TU_USUARIO/footsearch-backend:1.0.0 ./backend

# súbela
docker push TU_USUARIO/footsearch-backend:latest
docker push TU_USUARIO/footsearch-backend:1.0.0
```

### 3. Cada vez que actualices el código

```bash
docker build -t TU_USUARIO/footsearch-backend:latest ./backend
docker push TU_USUARIO/footsearch-backend:latest
```

### 4. Desplegar desde Docker Hub (en otra máquina/servidor)

En `docker-compose.yml`, en el servicio `backend`:
- **Comenta** la línea `build: ./backend`
- **Descomenta** `image: TU_USUARIO/footsearch-backend:latest`

Luego, en el servidor:

```bash
docker compose pull        # baja la última imagen de Docker Hub
docker compose up -d       # recrea SOLO el backend; los datos siguen intactos
```

Eso es exactamente lo que pediste: **al actualizar, se baja desde Docker Hub
y los datos ingresados persisten** (porque están en los volúmenes).

---

## Cuando lo subas a internet (más adelante)

Cuando quieras exponerlo públicamente, los cambios serán pequeños:

1. Cambia `JWT_SECRET` por uno fuerte (`openssl rand -hex 32`).
2. Cambia las contraseñas de Postgres/Mongo en el `.env`.
3. Pon `CLIENT_ORIGIN` con el dominio real de tu frontend.
4. **No** expongas los puertos 5432 / 27017 al exterior (quita esos `ports:`
   del compose; el backend igual los alcanza por la red interna de Docker).
5. Pon un proxy inverso (Nginx / Caddy / Traefik) con HTTPS delante del backend.
6. Para los videos en serio: usa un almacenamiento externo (S3 o similar)
   en vez del volumen local.

La arquitectura ya está pensada para ese salto: las credenciales son variables
de entorno, el backend usa nombres de servicio (no `localhost`), y los datos
están en volúmenes.

---

## Resumen de "¿se borran mis datos?"

| Acción                          | ¿Datos a salvo? |
|---------------------------------|-----------------|
| `docker compose stop` / `up`    | ✅ Sí           |
| `docker compose down`           | ✅ Sí           |
| Actualizar imagen + `pull`/`up` | ✅ Sí           |
| Reiniciar la PC                 | ✅ Sí           |
| `docker compose down -v`        | ❌ NO (los borra) |
| Borrar el volumen a mano        | ❌ NO            |
