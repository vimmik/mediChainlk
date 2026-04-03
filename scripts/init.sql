-- Enable extensions required by the platform
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- pg_trgm enables fuzzy medicine name matching via PostgreSQL
-- Used by: SELECT * FROM medicines WHERE generic_name % 'paracetamol' ORDER BY similarity(generic_name, 'paracetamol') DESC;
