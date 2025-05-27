# Deployment Guide for Marker Tracker

This document provides instructions for deploying the Marker Tracker application to a production environment.

## Prerequisites

- Node.js (v16 or newer)
- MySQL database (Hostinger provides MySQL)
- Git

## Deployment Options

### Option 1: Standard Server Deployment

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd marker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your production database connection string:
   ```
   DATABASE_URL="mysql://username:password@your-hostinger-db-host:3306/marker_tracker"
   ```
   
   For Hostinger specifically, the connection string format will be:
   ```
   DATABASE_URL="mysql://your_hostinger_db_username:your_hostinger_db_password@your_hostinger_db_host:3306/your_hostinger_db_name"
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
   pm2 start npm --name "marker" -- start
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
         - DATABASE_URL=mysql://root:mysql_password@db:3306/marker_tracker
       restart: always

     db:
       image: mysql:8.0
       ports:
         - "3306:3306"
       environment:
         - MYSQL_ROOT_PASSWORD=mysql_password
         - MYSQL_DATABASE=marker_tracker
       volumes:
         - mysql_data:/var/lib/mysql
       command: --default-authentication-plugin=mysql_native_password

   volumes:
     mysql_data:
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

## Hostinger-Specific Deployment

### Setting up MySQL Database on Hostinger

1. **Log in to your Hostinger control panel**

2. **Access the Database section**
   - Create a new MySQL database
   - Note your database name, username, password, and host

3. **Configure your application**
   Update your `.env` file with the Hostinger MySQL connection string:
   ```
   DATABASE_URL="mysql://hostinger_db_username:hostinger_db_password@hostinger_db_host:3306/hostinger_db_name"
   ```

4. **Upload your application**
   - Using Hostinger's File Manager or FTP
   - Ensure you've built the application locally with `npm run build` before uploading

5. **Set up environment variables**
   - Configure the DATABASE_URL environment variable in Hostinger
   - Configure any other environment variables your application needs

6. **Initialize the database**
   - Connect to your MySQL database using the provided credentials
   - Run the necessary Prisma migrations or setup commands

7. **Start your application**
   - Use Hostinger's Node.js application manager if available
   - Or set up a custom Node.js environment as per Hostinger's documentation

## Troubleshooting

- **Database Connection Issues**: Ensure your database is accessible from the deployment environment and that the connection string is correct. Hostinger may have specific firewall rules or connection requirements.
- **Build Failures**: Check for any TypeScript errors or dependency issues
- **Performance Issues**: Consider adding a caching layer for frequently accessed marker data
- **MySQL Specific Issues**: Make sure your MySQL version is compatible with Prisma (MySQL 5.7+ or 8.0+ recommended)

For additional help, refer to the [Next.js deployment documentation](https://nextjs.org/docs/deployment) and [Hostinger's documentation](https://support.hostinger.com).
