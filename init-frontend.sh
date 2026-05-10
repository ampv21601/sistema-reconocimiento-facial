#!/bin/bash
# init-frontend.sh - Ejecutar esto UNA SOLA VEZ

echo "Creando frontend..."
docker run --rm -v ${PWD}:/app -w /app node:20-alpine \
  sh -c "npx create-vite@latest frontend -- --template react --yes"

echo "Instalando dependencias..."
docker run --rm -v ${PWD}:/app -w /app/frontend node:20-alpine \
  sh -c "npm install && npm install axios @mui/material @emotion/react @emotion/styled react-router-dom"

echo "Configurando Vite..."
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})
EOF

echo "✅ Frontend listo!"