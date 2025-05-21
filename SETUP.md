# Next steps to run the Marker Tracker application

Follow these steps to get your Marker Tracker application up and running:

1. **Set up the PostgreSQL database:**
   - Install PostgreSQL if you haven't already
   - Create a new database for your application
   - Update your `.env` file with your database connection string
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/marker_tracker?schema=public"
   ```

2. **Push the database schema:**
   ```bash
   cd /Users/marnienickelson/Documents/marker/marker-tracker
   npm run db:push
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Open your browser and navigate to http://localhost:3000
   - You can now use the application to:
     - Add markers at /add
     - View all markers at /markers
     - Search for markers on the home page

5. **Optional: Use Prisma Studio to manage data:**
   ```bash
   npm run db:studio
   ```
   This will open a web interface at http://localhost:5555 where you can view and edit your database data.

## Application structure overview:

- **app/page.tsx**: Home page with search functionality
- **app/add/page.tsx**: Page for adding new markers
- **app/markers/page.tsx**: Page for viewing all markers
- **app/api/markers/route.ts**: API endpoint for creating/retrieving markers
- **app/api/markers/search/route.ts**: API endpoint for searching markers
- **app/components/**: Contains UI components
- **prisma/schema.prisma**: Database schema definition

## Troubleshooting tips:

- If you encounter database connection issues, ensure your PostgreSQL server is running
- Check that your `.env` file has the correct credentials
- Run `npx prisma generate` if you change the schema to update the Prisma client
