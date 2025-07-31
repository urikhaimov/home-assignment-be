-- This file will be executed when the PostgreSQL container starts
-- It's mainly for setting up extensions or initial database structure if needed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables will be created by TypeORM synchronization