# Deployment Guide for Marker Tracker

This document provides instructions for deploying the Marker Tracker application to a production environment.

## Prerequisites

- Node.js (v16 or newer)
- PostgreSQL database
- Git

## Deployment Options

### Option 1: Standard Server Deployment

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd marker-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your production database connection string:
   ```
   DATABASE_URL="postgresql://username:password@your-production-db-host:5432/marker_tracker?schema=public"
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Set up the database**
   ```bash
   npm run db:push
   ```

6. **Start the production server**
   ```bash
   npm start
   ```

7. **Optional: Use a process manager**
   For keeping your application running, consider using PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "marker-tracker" -- start
   ```

### Option 2: Docker Deployment

1. **Create a Dockerfile in the project root**
   ```dockerfile
   FROM node:18-alpine AS base

   # Dependencies
   FROM base AS deps
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci

   # Builder
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production

   # Copy necessary files
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json
   COPY --from=builder /app/prisma ./prisma

   # Set environment variables
   ENV PORT 3030

   # Expose the port
   EXPOSE 3030

   # Start the application
   CMD ["npm", "start"]
   ```

2. **Create a docker-compose.yml file**
   ```yaml
   version: '3'

   services:
     app:
       build: .
       ports:
         - "3030:3030"
       depends_on:
         - db
       environment:
         - DATABASE_URL=postgresql://postgres:postgres@db:5432/marker_tracker?schema=public
       restart: always

     db:
       image: postgres:16
       ports:
         - "5432:5432"
       environment:
         - POSTGRES_PASSWORD=postgres
         - POSTGRES_USER=postgres
         - POSTGRES_DB=marker_tracker
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Set up the database**
   ```bash
   docker-compose exec app npx prisma db push
   ```

### Option 3: Vercel Deployment

1. **Push your code to GitHub**

2. **Create a Vercel account** at [vercel.com](https://vercel.com)

3. **Import your repository** from GitHub

4. **Configure environment variables**
   - Add your `DATABASE_URL` as an environment variable in the Vercel project settings

5. **Deploy**
   - Vercel will automatically build and deploy your application

6. **Set up the database**
   Run the Prisma commands locally with the Vercel production database URL:
   ```bash
   npx prisma db push
   ```

## Post-Deployment Steps

1. **Seed the database with initial data (optional)**
   ```bash
   npm run db:seed
   ```

2. **Set up monitoring**
   Consider setting up monitoring with tools like:
   - New Relic
   - Datadog
   - Sentry

3. **Set up backups**
   Ensure regular backups of your PostgreSQL database

4. **Set up HTTPS**
   If not using a platform that provides HTTPS automatically (like Vercel), set up HTTPS using:
   - Let's Encrypt with Certbot
   - Nginx as a reverse proxy

## Troubleshooting

- **Database Connection Issues**: Ensure your database is accessible from the deployment environment and that the connection string is correct
- **Build Failures**: Check for any TypeScript errors or dependency issues
- **Performance Issues**: Consider adding a caching layer for frequently accessed marker data

For additional help, refer to the [Next.js deployment documentation](https://nextjs.org/docs/deployment).
