# Migrating from PostgreSQL to MySQL

This guide will help you migrate your Inkventory application from PostgreSQL to MySQL (for Hostinger deployment).

## 1. Update Prisma Schema

The Prisma schema has been updated to use MySQL:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "foreignKeys"
}
```

## 2. Update Environmental Variables

Update your `.env` file to use a MySQL connection string:

```
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
```

For local development with MySQL:
```
DATABASE_URL="mysql://root:password@localhost:3306/marker_tracker"
```

For production on Hostinger:
```
DATABASE_URL="mysql://your_hostinger_username:your_hostinger_password@your_hostinger_hostname:3306/your_hostinger_database"
```

## 3. Install MySQL Dependencies

We've added the necessary MySQL dependencies:

```bash
npm install mysql2
```

## 4. Reset and Generate the Prisma Client

After updating the schema and connection information:

```bash
npx prisma generate
```

## 5. Create New Database and Apply Migrations

If starting with a fresh database:

```bash
# Local development
npx prisma migrate dev --name init

# Production
npx prisma migrate deploy
```

## 6. Data Migration (if needed)

If you need to transfer existing data from PostgreSQL to MySQL:

1. Export data from PostgreSQL:
   ```bash
   pg_dump -U postgres -d marker_tracker -f pg_data.sql
   ```

2. Convert PostgreSQL SQL to MySQL compatible SQL (you may need to modify syntax manually)

3. Import data into MySQL:
   ```bash
   mysql -u username -p marker_tracker < mysql_data.sql
   ```

## 7. Verify the Migration

Test your application thoroughly with MySQL to ensure all functionality works as expected.

## MySQL Specific Considerations

1. **Case Sensitivity**: MySQL can be case-sensitive for table names depending on the server's configuration and operating system

2. **Transaction Isolation**: The default transaction isolation level may differ between PostgreSQL and MySQL

3. **Text Field Limits**: MySQL's TEXT types have different size limits than PostgreSQL

4. **JSON Support**: While both support JSON, the functions and performance characteristics differ

For additional help with MySQL on Hostinger, refer to [Hostinger's MySQL documentation](https://support.hostinger.com/en/articles/4455931-how-to-access-mysql-databases).
