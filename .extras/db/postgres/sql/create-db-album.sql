-- (1) in extras\compose\compose.yml
--        auskommentieren:
--           Zeile mit "command:" und nachfolgende Listenelemente mit führendem "-"
--              damit der PostgreSQL-Server ohne TLS gestartet wird
--           bei den Listenelementen unterhalb von "volumes:" die Zeilen mit "read_only:" bei key.pem und certificate.crt
--              damit die Zugriffsrechte fuer den privaten Schluessel und das Zertifikat nachfolgend gesetzt werden koennen
--           Zeile mit "user:"
--              damit der PostgreSQL-Server implizit mit dem Linux-User "root" gestartet wird
--        Kommentar entfernen:
--           Zeile mit "#cap_add: [...]"
-- (2) PowerShell:
--     cd .extras\compose\db\postgres
--     docker compose up db
-- (3) 2. PowerShell:
--     cd .extras\compose\db\postgres
--     docker compose exec db bash
--        chown postgres:postgres /var/lib/postgresql/tablespace
--        chown postgres:postgres /var/lib/postgresql/tablespace/album
--        chown postgres:postgres /var/lib/postgresql/key.pem
--        chown postgres:postgres /var/lib/postgresql/certificate.crt
--        chmod 400 /var/lib/postgresql/key.pem
--        chmod 400 /var/lib/postgresql/certificate.crt
--        exit
--     docker compose down
-- (3) in compose.yml die obigen Kommentare wieder entfernen, d.h.
--        PostgreSQL-Server mit TLS starten
--        key.pem und certificate.crt als readonly
--        den Linux-User "postgres" wieder aktivieren
--     in compose.yml die Zeile "cap_add: [...]" wieder auskommentieren
-- (4) 1. PowerShell:
--     docker compose up db
-- (5) 2. PowerShell:
--     docker compose exec db bash
--        psql --dbname=postgres --username=postgres --file=/sql/create-db-album.sql
--        psql --dbname=album --username=album --file=/sql/create-schema-album.sql
--        exit
--      docker compose down

CREATE ROLE album LOGIN PASSWORD 'p';

CREATE DATABASE album;

GRANT ALL ON DATABASE album TO album;

CREATE TABLESPACE albumspace OWNER album LOCATION '/var/lib/postgresql/tablespace/album';
