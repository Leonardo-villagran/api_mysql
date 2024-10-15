#!/bin/bash

# Hacer git pull
echo "Ejecutando git pull..."
if git pull; then
    echo "Git pull realizado con éxito."
else
    echo "Error: Falló git pull."
    exit 1
fi

# Ejecutar docker-compose
echo "Ejecutando docker-compose up -d --build..."
if docker-compose up -d --build; then
    echo "Docker-compose ejecutado con éxito."
else
    echo "Error: Falló docker-compose."
    exit 1
fi

echo "Actualización completada."