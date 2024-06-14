/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}
 * @packageDocumentation
 */

import { Album } from '../entity/album.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Interpret } from '../entity/interpret.entity.js';
import { Repository } from 'typeorm';
import { Song } from '../entity/song.entity.js';
import { type Suchkriterien } from './suchkriterien.js';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';

/** Typdefinition für die Suche mit der Album-ID. */
export interface BuildIdParams {
    /** ID des gesuchten Albums. */
    readonly id: number;
}

/**
 * Die Klasse 'QueryBuilder' implementiert das Lesen für Alben und greift
 * mit _TypeORM_ auf eine relationale Datenbank zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #albumAlias = `${Album.name
        .charAt(0)
        .toLowerCase()}${Album.name.slice(1)}`;

    readonly #interpretAlias = `${Interpret.name
        .charAt(0)
        .toLowerCase()}${Interpret.name.slice(1)}`;

    readonly #songAlias = `${Song.name
        .charAt(0)
        .toLowerCase()}${Song.name.slice(1)}`;

    readonly #repo: Repository<Album>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Album) repo: Repository<Album>) {
        this.#repo = repo;
    }

    /**
     * Ein Album mit einer ID suchen.
     * @param id ID des gesuchten Albums
     * @returns QueryBuilder
     */
    buildId({ id }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#albumAlias);

        queryBuilder.innerJoinAndSelect(
            `${this.#albumAlias}.interpret`,
            this.#interpretAlias,
        );

        queryBuilder.leftJoinAndSelect(
            `${this.#albumAlias}.songs`,
            this.#songAlias,
        );

        queryBuilder.where(`${this.#albumAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Alben asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // eslint-disable-next-line max-lines-per-function
    build({ interpret, pop, alternative, ...props }: Suchkriterien) {
        this.#logger.debug(
            'build: interpret=%s, pop=%s, alternative=%s, props=%o',
            interpret,
            pop,
            alternative,
            props,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#albumAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#albumAlias}.interpret`,
            'interpret',
        );

        // z.B. { interpret: 'a', rating: 5, pop: true }

        let useWhere = true;

        if (interpret !== undefined && typeof interpret === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#interpretAlias}.interpret ${ilike} :interpret`,
                { interpret: `%${interpret}%` },
            );
            useWhere = false;
        }

        if (pop === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(`${this.#albumAlias}.genres like '%POP%'`)
                : queryBuilder.andWhere(
                      `${this.#albumAlias}.genres like '%POP%'`,
                  );
            useWhere = false;
        }

        if (alternative === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#albumAlias}.genres like '%ALTERNATIVE%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#albumAlias}.genres like '%ALTERNATIVE%'`,
                  );
            useWhere = false;
        }

        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = (props as Record<string, any>)[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#albumAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#albumAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
