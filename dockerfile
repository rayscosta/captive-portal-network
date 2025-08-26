FROM node:18
WORKDIR /app
COPY package*.json ./
ARG PORT=6000
ENV PORT=$PORT
RUN npm ci
COPY . .
EXPOSE $PORT
CMD ["npm", "start"]