// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { type Album } from '../entity/album.entity.js';
import { AlbumDTO } from '../rest/albumDTO.entity.js';
import { AlbumWriteService } from '../service/album-write.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { type IdInput } from './album-query.resolver.js';
import { type Interpret } from '../entity/interpret.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Song } from '../entity/song.entity.js';

import { getLogger } from '../../logger/logger.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export interface CreatePayload {
    readonly id: number;
}

export interface UpdatePayload {
    readonly version: number;
}

export class AlbumUpdateDTO extends AlbumDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class AlbumMutationResolver {
    readonly #service: AlbumWriteService;

    readonly #logger = getLogger(AlbumMutationResolver.name);

    constructor(service: AlbumWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async create(@Args('input') albumDTO: AlbumDTO) {
        this.#logger.debug('create: albumDTO=%o', albumDTO);

        const album = this.#albumDtoToAlbum(albumDTO);
        const id = await this.#service.create(album);
        this.#logger.debug('createAlbum: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async update(@Args('input') albumDTO: AlbumUpdateDTO) {
        this.#logger.debug('update: album=%o', albumDTO);

        const album = this.#albumUpdateDtoToAlbum(albumDTO);
        const versionStr = `"${albumDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(albumDTO.id, 10),
            album,
            version: versionStr,
        });
        this.#logger.debug('updateAlbum: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin'] })
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug('deleteAlbum: deletePerformed=%s', deletePerformed);
        return deletePerformed;
    }

    #albumDtoToAlbum(albumDTO: AlbumDTO): Album {
        const interpretDTO = albumDTO.interpret;
        const interpret: Interpret = {
            id: undefined,
            interpret: interpretDTO.interpret,
            geburtsdatum: interpretDTO.geburtsdatum,
            album: undefined,
        };
        const songs = albumDTO.songs?.map((songDTO) => {
            const song: Song = {
                id: undefined,
                songtitel: songDTO.songtitel,
                dauer: songDTO.dauer,
                feature: songDTO.feature,
                album: undefined,
            };
            return song;
        });
        const album: Album = {
            id: undefined,
            version: undefined,
            ean: albumDTO.ean,
            rating: albumDTO.rating,
            art: albumDTO.art,
            titel: albumDTO.titel,
            preis: albumDTO.preis,
            rabatt: albumDTO.rabatt,
            lieferbar: albumDTO.lieferbar,
            erscheinungsdatum: albumDTO.erscheinungsdatum,
            homepage: albumDTO.homepage,
            genres: albumDTO.genres,
            interpret,
            songs,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        // Rueckwaertsverweis
        album.interpret!.album = album;
        return album;
    }

    #albumUpdateDtoToAlbum(albumDTO: AlbumUpdateDTO): Album {
        return {
            id: undefined,
            version: undefined,
            ean: albumDTO.ean,
            rating: albumDTO.rating,
            art: albumDTO.art,
            titel: albumDTO.titel,
            preis: albumDTO.preis,
            rabatt: albumDTO.rabatt,
            lieferbar: albumDTO.lieferbar,
            erscheinungsdatum: albumDTO.erscheinungsdatum,
            homepage: albumDTO.homepage,
            genres: albumDTO.genres,
            interpret: undefined,
            songs: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }

    // #errorMsgCreateAlbum(err: CreateError) {
    //     switch (err.type) {
    //         case 'IsbnExists': {
    //             return `Die ISBN ${err.ean} existiert bereits`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }

    // #errorMsgUpdateAlbum(err: UpdateError) {
    //     switch (err.type) {
    //         case 'AlbumNotExists': {
    //             return `Es gibt kein Album mit der ID ${err.id}`;
    //         }
    //         case 'VersionInvalid': {
    //             return `"${err.version}" ist keine gueltige Versionsnummer`;
    //         }
    //         case 'VersionOutdated': {
    //             return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }
}
