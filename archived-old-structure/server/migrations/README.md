# Database Migrations

This directory contains database migrations for the application.

## Migration Strategy

We use Drizzle ORM's migration system to manage database schema changes.

## Creating Migrations

To generate a new migration:

1. Update your schema in `shared/schema.ts`
2. Run the Drizzle Kit migration generation command:
   ```bash
   npx drizzle-kit generate:pg --schema ./shared/schema.ts --out ./server/migrations/sql
   ```

## Running Migrations

To apply migrations to the database:

```bash
npx tsx server/migrations/migrate.ts
```

## Naming Convention

Migration files are automatically named by Drizzle Kit in the format:
`{timestamp}_{description}.sql`

## Best Practices

1. Always review generated migrations before applying them
2. Test migrations on a development database before applying to production
3. Don't modify existing migration files - create new ones instead
4. Keep migrations small and focused on specific changes