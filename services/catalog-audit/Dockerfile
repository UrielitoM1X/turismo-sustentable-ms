# Usar imagen oficial ligera de Python
FROM python:3.12-slim

# Evitar generacion de archivos pyc y habilitar salida directa en consola
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema requeridas por librerias geoespaciales
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar codigo fuente
COPY ./src ./src

# Exponer puerto interno del servicio
EXPOSE 8000

# Iniciar servidor ASGI con recarga automatica para desarrollo
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]