# Stage 1: Build Angular Application
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

# Run build (Angular 19 output is written to dist/frontend/browser or similar)
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from build stage (standard path for Angular projects)
# Copy built assets from build stage
COPY --from=build /app/dist/frontend /usr/share/nginx/html/


# Copy custom nginx routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
