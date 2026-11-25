# Usar imagen oficial ligera de Node
FROM node:20-alpine

# Configurar entorno de produccion
ENV NODE_ENV=production

# Establecer directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar codigo fuente y asegurar permisos para usuario no privilegiado
COPY ./src ./src
RUN chown -R node:node /app

USER node

# Exponer puerto interno del servicio
EXPOSE 3000

# Ejecutar servidor Express
CMD ["npm", "start"]