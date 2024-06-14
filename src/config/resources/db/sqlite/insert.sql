INSERT INTO album(id, version, ean, rating, art, titel, preis, rabatt, lieferbar, erscheinungsdatum, homepage, genres, erzeugt, aktualisiert) VALUES
    (1,0,'5901234123457',5,'STUDIOALBUM ','Good Kid, M.A.A.D City',14.99,0.02,true,'01.02.2012','https://kendricklamar.com','POP','01.02.2022 00:00','01.02.2022 00:00');
INSERT INTO album(id, version, ean, rating, art, titel, preis, rabatt, lieferbar, erscheinungsdatum, homepage, genres, erzeugt, aktualisiert) VALUES
    (20,0,'5801234123457',4,'STUDIOALBUM','When We All Fall Asleep, Where Do We Go?',12.99,0.01,true,'29.03.2019','https://billieeilish.com','POP,ALTERNATIVE','02.02.2022 00:00','02.02.2022 00:00');
INSERT INTO album(id, version, ean, rating, art, titel, preis, rabatt, lieferbar, erscheinungsdatum, homepage, genres, erzeugt, aktualisiert) VALUES
    (30,0,'5701234123457',3,'STUDIOALBUM','Hollywood''s Bleeding',11.99,0.03,true,'06.09.2019','https://postmalone.com','ALTERNATIVE,POP','03.02.2022 00:00','03.02.2022 00:00');
INSERT INTO album(id, version, ean, rating, art, titel, preis, rabatt, lieferbar, erscheinungsdatum, homepage, genres, erzeugt, aktualisiert) VALUES
    (40,0,'5601234123457',4,'STUDIOALBUM','Astroworld',17.99,0.05,true,'03.08.2018','https://travisscott.com','ALTERNATIVE','04.02.2022 00:00','04.02.2022 00:00');
INSERT INTO album(id, version, ean, rating, art, titel, preis, rabatt, lieferbar, erscheinungsdatum, homepage, genres, erzeugt, aktualisiert) VALUES
    (50,0,'5501234123457',2,'STUDIOALBUM','Cuz I Love You',10.99,0.02,true,'19.04.2019','https://lizzomusic.com','POP','05.02.2022 00:00','05.02.2022 00:00');
INSERT INTO album(id, version, ean, rating, art, titel, preis, rabatt, lieferbar, erscheinungsdatum, homepage, genres, erzeugt, aktualisiert) VALUES
    (60,0,'5401234123457',1,'STUDIOALBUM','After Hours',13.99,0.04,true,'20.03.2020','https://theweeknd.com','POP,ALTERNATIVE','06.02.2022 00:00','06.02.2022 00:00');

INSERT INTO interpret(id, interpret, geburtsdatum, album_id) VALUES
    (1,'Kendrick Lamar',34,1);
INSERT INTO interpret(id, interpret, geburtsdatum, album_id) VALUES
    (20,'Billie Eilish',20,20);
INSERT INTO interpret(id, interpret, geburtsdatum, album_id) VALUES
    (30,'Post Malone',26,30);
INSERT INTO interpret(id, interpret, geburtsdatum, album_id) VALUES
    (40,'Travis Scott',30,40);
INSERT INTO interpret(id, interpret, geburtsdatum, album_id) VALUES
    (50,'Lizzo',33,50);
INSERT INTO interpret(id, interpret, geburtsdatum, album_id) VALUES
    (60,'The Weeknd',32,60);

INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (1,'DNA','03:05',null,1);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (20,'Bad Guy','03:14',null,20);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (21,'Therefore I Am','02:54',null,20);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (30,'Circles','03:22',null,30);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (31,'Sunflower','02:38','Swae Lee',30);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (40,'Sicko Mode','05:12','Kendrick Lamar',40);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (50,'Truth Hurts','02:53',null,50);
INSERT INTO song(id, songtitel, dauer, feature, album_id) VALUES
    (60,'Blinding Lights','03:20',null,60);
