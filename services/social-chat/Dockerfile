# Usar imagen oficial ligera de Node
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar codigo fuente
COPY ./src ./src

# Exponer puerto interno del servicio
EXPOSE 3000

# Ejecutar servidor Express
CMD ["npm", "start"]