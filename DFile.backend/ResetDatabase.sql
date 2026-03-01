-- ============================================================================
-- DFile: Drop ALL tables (keep the database itself intact)
-- ============================================================================
-- Run this against the production/dev database when you need a clean slate.
-- After running, restart the .NET backend (dotnet run). DbInitializer will:
--   1. Database.Migrate()  → recreate all tables from EF migrations
--   2. SeedAll()           → populate tenants, users, categories, rooms, etc.
-- ============================================================================

-- Step 1: Drop ALL foreign key constraints first (order-independent)
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += N'ALTER TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name)
             + N' DROP CONSTRAINT ' + QUOTENAME(f.name) + ';' + CHAR(13)
FROM sys.foreign_keys f
INNER JOIN sys.tables t ON f.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id;

EXEC sp_executesql @sql;
PRINT 'All foreign key constraints dropped.';

-- Step 2: Drop ALL user tables (including __EFMigrationsHistory)
SET @sql = N'';

SELECT @sql += N'DROP TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ';' + CHAR(13)
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.is_ms_shipped = 0;

EXEC sp_executesql @sql;
PRINT 'All tables dropped. Restart the backend to recreate and reseed.';
