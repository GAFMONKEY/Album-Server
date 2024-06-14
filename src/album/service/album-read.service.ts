/**
 * Das Modul besteht aus der Klasse {@linkcode AlbumReadService}.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Album } from './../entity/album.entity.js';
import { QueryBuilder } from './query-builder.js';
import { type Suchkriterien } from './suchkriterien.js';
import { getLogger } from '../../logger/logger.js';

/**
 * Typdefinition für 'findById'
 */
export interface FindByIdParams {
    /** ID des gesuchten Albums */
    readonly id: number;
}

/**
 * Die Klasse 'AlbumReadService' implementiert das Lesen für Albenund greift
 * mit _TypeORM: auf eine relationale Datenbank zu.
 */
@Injectable()
export class AlbumReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #albumProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(AlbumReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const albumDummy = new Album();
        this.#albumProps = Object.getOwnPropertyNames(albumDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * Ein Album asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Albums
     * @returns Das gefundene Album vom Typ [Album] in einem Promise.
     * @throws NotFoundException falls kein Album mit der ID existiert.
     */
    async findById({ id }: FindByIdParams) {
        this.#logger.debug('findById: id=%id', id);
        this.#logger.debug('albumProps: %ap', this.#albumProps);

        const album = await this.#queryBuilder.buildId({ id }).getOne();

        if (album === null) {
            throw new NotFoundException(`Es gibt kein Album mit der ID ${id}.`);
        }
        if (album.genres === null) {
            album.genres = [];
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: album=%s, interpret=%o',
                album.toString(),
                album.interpret,
            );
        }
        return album;
    }

    /**
     * Alben asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Alben.
     * @throws NotFoundException falls keine Alben gefunden wurden.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // keine Suchkriterien?
        if (suchkriterien === undefined) {
            return this.#queryBuilder.build({}).getMany();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#queryBuilder.build(suchkriterien).getMany();
        }

        // Falsche Namen für Suchkriterien?
        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        // Das Resultat ist eine leere Liste, falls nichts gefunden
        const alben = await this.#queryBuilder.build(suchkriterien).getMany();
        if (alben.length === 0) {
            this.#logger.debug('find: Keine Alben gefunden');
            throw new NotFoundException(
                `Keine Alben gefunden: ${JSON.stringify(suchkriterien)}`,
            );
        }
        this.#logger.debug('find: alben=%o', alben);
        return alben;
    }

    #checkKeys(keys: string[]) {
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#albumProps.includes(key) &&
                key !== 'pop' &&
                key !== 'alternative'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
