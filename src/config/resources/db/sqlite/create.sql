-- https://docs.python.org/dev/library/sqlite3.html#sqlite3-cli
-- sqlite3 album.sqlite

-- https://sqlite.org/lang_createtable.html
-- https://sqlite.org/stricttables.html ab 3.37.0
-- https://sqlite.org/syntax/column-constraint.html
-- https://sqlite.org/autoinc.html
-- https://sqlite.org/stricttables.html: INT, INTEGER, REAL, TEXT
-- https://sqlite.org/lang_createindex.html
-- https://stackoverflow.com/questions/37619526/how-can-i-change-the-default-sqlite-timezone

CREATE TABLE IF NOT EXISTS album (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    version            INTEGER NOT NULL DEFAULT 0,
    ean                TEXT NOT NULL UNIQUE,
    rating             INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
    art                TEXT,
    titel              TEXT NOT NULL,
    preis              REAL,
    rabatt             REAL,
    lieferbar          INTEGER NOT NULL CHECK (lieferbar = 0 OR lieferbar = 1) DEFAULT 0,
    erscheinungsdatum  TEXT,
    homepage           TEXT,
    genres              TEXT,
    erzeugt            TEXT NOT NULL,
    aktualisiert       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS album_ean_idx ON album(ean);

CREATE TABLE IF NOT EXISTS interpret (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    interpret           TEXT NOT NULL,
    geburtsdatum        TEXT,
    album_id            INTEGER NOT NULL UNIQUE REFERENCES album
);


CREATE TABLE IF NOT EXISTS song (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    songtitel           TEXT NOT NULL,
    dauer           TEXT NOT NULL,
    feature         TEXT,
    album_id        INTEGER NOT NULL REFERENCES album
);
CREATE INDEX IF NOT EXISTS song_album_id_idx ON song(album_id);
