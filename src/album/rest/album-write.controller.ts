/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import { AlbumDTO, AlbumDtoOhneRef } from './albumDTO.entity.js';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { type Album } from '../entity/album.entity.js';
import { AlbumWriteService } from '../service/album-write.service.js';
import { type Interpret } from '../entity/interpret.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Song } from '../entity/song.entity.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';
/**
 * Die Controller-Klasse für die Verwaltung von Bücher.
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Album REST-API')
@ApiBearerAuth()
export class AlbumWriteController {
    readonly #service: AlbumWriteService;

    readonly #logger = getLogger(AlbumWriteController.name);

    constructor(service: AlbumWriteService) {
        this.#service = service;
    }

    /**
     * Ein neues Album wird asynchron angelegt. Das neu anzulegende Album ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Album abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der Interpret oder die EAN-Nummer bereits
     * existieren.
     *
     * @param albumDTO JSON-Daten für ein Album im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @Roles({ roles: ['admin', 'user'] })
    @ApiOperation({ summary: 'Ein neues Album anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Albumdaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() albumDTO: AlbumDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: albumDTO=%o', albumDTO);

        const album = this.#albumDtoToAlbum(albumDTO);
        const id = await this.#service.create(album);

        const location = `${getBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Ein vorhandenes Album wird asynchron aktualisiert.
     *
     * Im Request-Objekt von Express muss die ID des zu aktualisierenden Albums
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf das zu
     * aktualisierende Album als JSON-Datensatz enthalten sein. Damit die
     * Aktualisierung überhaupt durchgeführt werden kann, muss im Header
     * `If-Match` auf die korrekte Version für optimistische Synchronisation
     * gesetzt sein.
     *
     * Bei erfolgreicher Aktualisierung wird der Statuscode `204` (`No Content`)
     * gesetzt und im Header auch `ETag` mit der neuen Version mitgeliefert.
     *
     * Falls die Versionsnummer fehlt, wird der Statuscode `428` (`Precondition
     * required`) gesetzt; und falls sie nicht korrekt ist, der Statuscode `412`
     * (`Precondition failed`). Falls Constraints verletzt sind, wird der
     * Statuscode `400` (`Bad Request`) gesetzt und genauso auch wenn der neue
     * Interpret oder die neue EAN-Nummer bereits existieren.
     *
     * @param albumDTO Albumdaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles({ roles: ['admin', 'user'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Ein vorhandenes Album aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Albumdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() albumDTO: AlbumDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, albumDTO=%o, version=%s',
            id,
            albumDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('put: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const album = this.#albumDtoOhneRefToAlbum(albumDTO);
        const neueVersion = await this.#service.update({ id, album, version });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    /**
     * Ein Album wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param id Pfad-Paramater für die ID.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @Roles({ roles: ['admin'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Album mit der ID löschen' })
    @ApiNoContentResponse({
        description: 'Das Album wurde gelöscht oder war nicht vorhanden',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%s', id);
        await this.#service.delete(id);
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
        const album = {
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

        // Rueckwaertsverweise
        album.interpret.album = album;
        album.songs?.forEach((song) => {
            song.album = album;
        });
        return album;
    }

    #albumDtoOhneRefToAlbum(albumDTO: AlbumDtoOhneRef): Album {
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
}
