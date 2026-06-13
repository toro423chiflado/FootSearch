# ---- Imagen del backend de FootSearch ----
# Esta es la imagen que se sube a Docker Hub. NO contiene datos:
# los datos viven en los volúmenes de Postgres/Mongo y en el volumen de uploads.

FROM node:20-alpine

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias primero (mejor caché: solo se reinstala si cambian)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# La carpeta donde se guardan los videos subidos (se montará como volumen)
RUN mkdir -p uploads

# Puerto interno del API
EXPOSE 4000

# Arranca el servidor
CMD ["node", "src/server.js"]
