# Etapa 1: Compilar aplicacion TypeScript y Tailwind
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero para aprovechar cache
COPY package*.json ./
RUN npm install

# Copiar codigo fuente y generar empaquetado de produccion
COPY . .
RUN npm run build

# Etapa 2: Servir aplicacion compilada mediante Nginx ligero
FROM nginx:alpine

# Copiar configuracion SPA y archivos estaticos generados (dist o build)
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]