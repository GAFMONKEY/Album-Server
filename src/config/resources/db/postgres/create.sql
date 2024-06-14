-- docker compose exec postgres bash
-- psql --dbname=album --username=album --file=/scripts/create-table-album.sql

-- Indexe mit pgAdmin auflisten: "Query Tool" verwenden mit
--  SELECT   tablename, indexname, indexdef, tablespace
--  FROM     pg_indexes
--  WHERE    schemaname = 'album'
--  ORDER BY tablename, indexname;

-- https://www.postgresql.org/docs/devel/app-psql.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-CREATE
-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION album;

ALTER ROLE album SET search_path = 'album';

-- https://www.postgresql.org/docs/current/sql-createtype.html
-- https://www.postgresql.org/docs/current/datatype-enum.html
CREATE TYPE albumart AS ENUM ('STUDIOALBUM', 'LIVEALBUM');

-- https://www.postgresql.org/docs/current/sql-createtable.html
-- https://www.postgresql.org/docs/current/datatype.html
CREATE TABLE IF NOT EXISTS album (
                      -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT
                      -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS
                      -- impliziter Index fuer Primary Key
                      -- "GENERATED ALWAYS AS IDENTITY" gemaess SQL-Standard
                      -- entspricht SERIAL mit generierter Sequenz album_id_seq
    id                integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE albumspace,
                      -- https://www.postgresql.org/docs/current/ddl-constraints.html#id-1.5.4.6.6
    version           integer NOT NULL DEFAULT 0,
                      -- impliziter Index als B-Baum durch UNIQUE
                      -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS
    ean               varchar(17) NOT NULL UNIQUE USING INDEX TABLESPACE albumspace,
                      -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS
                      -- https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-POSIX-REGEXP
    rating            integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
    art               albumart,
                      -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL
                      -- 10 Stellen, davon 2 Nachkommastellen
    titel             varchar(40) NOT NULL,
    preis             decimal(8,2) NOT NULL,
    rabatt            decimal(4,3) NOT NULL,
                      -- https://www.postgresql.org/docs/current/datatype-boolean.html
    lieferbar         boolean NOT NULL DEFAULT FALSE,
                      -- https://www.postgresql.org/docs/current/datatype-datetime.html
    erscheinungsdatum date,
    homepage          varchar(40),
    genres            varchar(64),
                      -- https://www.postgresql.org/docs/current/datatype-datetime.html
    erzeugt           timestamp NOT NULL DEFAULT NOW(),
    aktualisiert      timestamp NOT NULL DEFAULT NOW()
) TABLESPACE albumspace;

CREATE TABLE IF NOT EXISTS interpret (
    id                integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE albumspace,
    interpret         varchar(40) NOT NULL,
    geburtsdatum      varchar(40),
    album_id          integer NOT NULL UNIQUE USING INDEX TABLESPACE albumspace REFERENCES album
) TABLESPACE albumspace;


CREATE TABLE IF NOT EXISTS song (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE albumspace,
    songtitel       varchar(32) NOT NULL,
    dauer           varchar(16) NOT NULL,
    feature         varchar(32),
    album_id        integer NOT NULL REFERENCES album
) TABLESPACE albumspace;
CREATE INDEX IF NOT EXISTS song_album_id_idx ON song(album_id) TABLESPACE albumspace;
