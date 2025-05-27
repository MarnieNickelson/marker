# Marker Tracker App

A modern web application built with Next.js, TypeScript, and PostgreSQL to track markers and their storage locations in organized grids. This application helps users manage their marker collections by providing a visual interface for tracking the location of each marker in storage grids.

![Marker Tracker](https://via.placeholder.com/800x400?text=Marker+Tracker+App)

## Features

- **Add Markers**: Add individual markers with their number, color name, and precise storage location
- **Edit Markers**: Update marker details and move them to new storage locations
- **Delete Markers**: Remove markers that are no longer in your collection
- **Bulk Import**: Import multiple markers at once using a CSV format
- **Visual Tracking**: Interactive grid visualization showing marker locations
- **Advanced Search**: Find markers quickly by number, color name, hex color code, or brand
- **Color Coding**: Markers are color-coded based on their color names for easier identification
- **Statistics**: View distribution statistics about your marker collection
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful user interface with animations and transitions
- **Dark Mode Support**: Comfortable viewing in different lighting conditions

## Prerequisites

- Node.js (v16 or newer)
- PostgreSQL database

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your database:
   - Create a PostgreSQL database for the application
   - Update the `.env` file with your database connection URL:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/marker_tracker?schema=public"
     ```
   - Replace `username`, `password`, and other parameters with your actual database credentials

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Storage Grid Information

The application tracks markers in two storage grids:
- Left Grid: 15 columns x 12 rows
- Right Grid: 15 columns x 12 rows

When adding a marker, specify which grid it's in and the exact column and row position.

## Key Pages

- **Home** (`/`): Main landing page with search functionality
- **Add Marker** (`/add`): Form to add individual markers
- **Import** (`/import`): Bulk import markers using CSV format
- **All Markers** (`/markers`): View and manage all your markers
- **Statistics** (`/stats`): Visual statistics about your marker collection

## Scripts

- `npm run dev`: Start development server on port 3030
- `npm run build`: Build the application for production
- `npm run start`: Start the production server on port 3030
- `npm run db:migrate`: Run Prisma migrations
- `npm run db:push`: Push schema changes to the database
- `npm run db:studio`: Open Prisma Studio to manage your data
- `npm run db:seed`: Populate the database with sample marker data

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
