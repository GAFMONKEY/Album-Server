import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Album } from '../entity/album.entity.js';
import { AlbumReadService } from '../service/album-read.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { Public } from 'nest-keycloak-connect';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { getLogger } from '../../logger/logger.js';

export interface IdInput {
    readonly id: number;
}

export interface SuchkriterienInput {
    readonly suchkriterien: Suchkriterien;
}

@Resolver((_: any) => Album)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class AlbumQueryResolver {
    readonly #service: AlbumReadService;

    readonly #logger = getLogger(AlbumQueryResolver.name);

    constructor(service: AlbumReadService) {
        this.#service = service;
    }

    @Query('album')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const album = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: album=%s, interpret=%o',
                album.toString(),
                album.interpret,
            );
        }
        return album;
    }

    @Query('alben')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const alben = await this.#service.find(input?.suchkriterien);
        this.#logger.debug('find: alben=%o', alben);
        return alben;
    }

    @ResolveField('rabatt')
    rabatt(@Parent() album: Album, short: boolean | undefined) {
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'rabatt: album=%s, short=%s',
                album.toString(),
                short,
            );
        }
        const rabatt = album.rabatt ?? 0;
        const shortStr = short === undefined || short ? '%' : 'Prozent';
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return `${(rabatt * 100).toFixed(2)} ${shortStr}`;
    }
}
