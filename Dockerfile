FROM node:25-alpine

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Vite dev server needs to bind to 0.0.0.0 for Docker
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

