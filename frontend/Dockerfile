# Imagen para el servidor de desarrollo de Vite (React).
FROM node:20-alpine

WORKDIR /app

# Instala dependencias primero (aprovecha la caché de Docker)
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
