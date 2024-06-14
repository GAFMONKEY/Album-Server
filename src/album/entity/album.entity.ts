/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Interpret } from './interpret.entity.js';
import { Song } from './song.entity.js';
import { dbType } from '../../config/db.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Albums.
 */
export type AlbumArt = 'STUDIOALBUM' | 'LIVEALBUM';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
@Entity()
export class Album {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: '0028948592241', type: String })
    readonly ean!: string;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'STUDIOALBUM', type: String })
    readonly art: AlbumArt | undefined;

    @Column()
    @ApiProperty({ example: 'Waterloo', type: String })
    readonly titel!: string;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 1, type: Number })
    // statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: number;

    @Column('decimal', {
        precision: 4,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @Column('decimal')
    @ApiProperty({ example: true, type: Boolean })
    readonly lieferbar: boolean | undefined;

    @Column('date')
    @ApiProperty({ example: '2023-04-13' })
    readonly erscheinungsdatum: Date | string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'https://test.de/', type: String })
    readonly homepage: string | undefined;

    @Column('simple-array')
    @ApiProperty({ example: ['HIP-HOP', 'ROCK'] })
    genres: string[] | null | undefined;

    @OneToOne(() => Interpret, (interpret) => interpret.album, {
        cascade: ['insert', 'remove'],
    })
    readonly interpret: Interpret | undefined;

    @OneToMany(() => Song, (song) => song.album, {
        cascade: ['insert', 'remove'],
    })
    readonly songs: Song[] | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            ean: this.ean,
            rating: this.rating,
            art: this.art,
            titel: this.titel,
            preis: this.preis,
            rabatt: this.rabatt,
            lieferbar: this.lieferbar,
            erscheinungsdatum: this.erscheinungsdatum,
            homepage: this.homepage,
            genres: this.genres,
            erzeugt: this.erzeugt,
            aktualisiert: this.aktualisiert,
        });
}
