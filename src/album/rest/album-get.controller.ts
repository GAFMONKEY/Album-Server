/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import { type Album, type AlbumArt } from '../entity/album.entity.js';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AlbumReadService } from '../service/album-read.service.js';
import { type Interpret } from '../entity/interpret.entity.js';
import { Public } from 'nest-keycloak-connect';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/** href-Link für HATEOAS */
export interface Link {
    /** href-Link für HATEOAS-Links */
    readonly href: string;
}

/** Links für HATEOAS */
export interface Links {
    /** self-Link */
    readonly self: Link;
    /** Optionaler Linke für list */
    readonly list?: Link;
    /** Optionaler Linke für add */
    readonly add?: Link;
    /** Optionaler Linke für update */
    readonly update?: Link;
    /** Optionaler Linke für remove */
    readonly remove?: Link;
}

export type InterpretModel = Omit<Interpret, 'album' | 'id'>;

export type AlbumModel = Omit<
    Album,
    'songs' | 'aktualisiert' | 'erzeugt' | 'id' | 'interpret' | 'version'
> & {
    interpret: InterpretModel;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

/** Album-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface AlbenModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        alben: AlbumModel[];
    };
}

/**
 * Klasse für 'AlbumGetController', um Queries in _OpenApi_ zu formulieren.
 */
export class AlbumQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly ean: string;

    @ApiProperty({ required: false })
    declare readonly rating: number;

    @ApiProperty({ required: false })
    declare readonly art: AlbumArt;

    @ApiProperty({ required: false })
    declare readonly preis: number;

    @ApiProperty({ required: false })
    declare readonly rabatt: number;

    @ApiProperty({ required: false })
    declare readonly lieferbar: boolean;

    @ApiProperty({ required: false })
    declare readonly erscheinungsdatum: string;

    @ApiProperty({ required: false })
    declare readonly homepage: string;

    @ApiProperty({ required: false })
    declare readonly pop: string;

    @ApiProperty({ required: false })
    declare readonly alternative: string;

    @ApiProperty({ required: false })
    declare readonly interpret: string;

    @ApiProperty({ required: false })
    declare readonly titel: string;
}

const APPLICATION_HAL_JSON = 'application/hal+json';

@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Album REST-API')
export class AlbumGetController {
    readonly #service: AlbumReadService;

    readonly #logger = getLogger(AlbumGetController.name);

    constructor(service: AlbumReadService) {
        this.#service = service;
    }

    /**
     * Ein Buch wird asynchron anhand seiner ID als Pfadparameter gesucht.
     * @param idStr Pfad-Parameter 'id'
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Suche mit der Album-ID' })
    @ApiParam({
        name: 'id',
        description: 'z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Das Album wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Album zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Das Album wurde bereits heruntergeladen',
    })
    async getById(
        @Param('id') idStr: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<AlbumModel | undefined>> {
        this.#logger.debug('getById: idStr=%s, version=%s', idStr, version);
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(`Die Album-ID ${idStr} ist ungueltig.`);
        }

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const album = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): album=%s', album.toString());
            this.#logger.debug('getById(): interpret=%o', album.interpret);
        }

        // ETags
        const versionDb = album.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        const albumModel = this.#toModel(album, req);
        this.#logger.debug('getById: albumModel=%o', albumModel);
        return res.contentType(APPLICATION_HAL_JSON).json(albumModel);
    }

    /**
     * Alben werden mit Query-Parametern asynchron gesucht.
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Respnse-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Alben' })
    async get(
        @Query() query: AlbumQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<AlbenModel | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const alben = await this.#service.find(query);
        this.#logger.debug('get: %o', alben);

        // HATEOAS: Atom Links je Album
        const albenModel = alben.map((album) =>
            this.#toModel(album, req, false),
        );
        this.#logger.debug('get: albemModel=%o', albenModel);

        const result: AlbenModel = { _embedded: { alben: albenModel } };
        return res.contentType(APPLICATION_HAL_JSON).json(result).send();
    }

    #toModel(album: Album, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = album;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: album=%o, links=%o', album, links);
        const interpretModel: InterpretModel = {
            interpret: album.interpret?.interpret ?? 'N/A',
            geburtsdatum: album.interpret?.geburtsdatum ?? 'N/A',
        };
        const albumModel: AlbumModel = {
            ean: album.ean,
            rating: album.rating,
            art: album.art,
            titel: album.titel,
            preis: album.preis,
            rabatt: album.rabatt,
            lieferbar: album.lieferbar,
            erscheinungsdatum: album.erscheinungsdatum,
            homepage: album.homepage,
            genres: album.genres,
            interpret: interpretModel,
            _links: links,
        };

        return albumModel;
    }
}
