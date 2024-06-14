import { type DeleteResult, Repository } from 'typeorm';
import {
    EanExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Album } from '../entity/album.entity.js';
import { AlbumReadService } from './album-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Interpret } from '../entity/interpret.entity.js';
import { MailService } from '../../mail/mail.service.js';
import { Song } from '../entity/song.entity.js';
import { getLogger } from '../../logger/logger.js';

/** Typdefinitionen zum Aktualisieren eines Albums mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Albums. */
    readonly id: number | undefined;
    /** Album-Objekt mit den aktualisierten Werten. */
    readonly album: Album;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
}

/**
 * Die Klasse `AlbumWriteService` implementiert den Anwendungskern für das
 * Schreiben von Alben und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class AlbumWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Album>;

    readonly #readService: AlbumReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(AlbumWriteService.name);

    constructor(
        @InjectRepository(Album) repo: Repository<Album>,
        readService: AlbumReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Album soll angelegt werden.
     * @param album Das neu abzulegende Album
     * @returns Die ID des neu angelegten Albums
     * @throws EanExists falls die EAN-Nummer bereits existiert
     */
    async create(album: Album): Promise<number> {
        this.#logger.debug('create: album=%o', album);
        await this.#validateCreate(album);

        const albumDb = await this.#repo.save(album); // implizite Transaktion
        this.#logger.debug('create: albumDb=%o', albumDb);

        await this.#sendmail(albumDb);

        return albumDb.id!;
    }

    /**
     * Ein vorhandenes Album soll aktualisiert werden. "Destructured" Argument
     * mit id (ID des zu aktualisierenden Albums), album (zu aktualisierendes Album)
     * und version (Versionsnummer für optimistische Synchronisation).
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws NotFoundException falls kein Album zur ID vorhanden ist
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({ id, album, version }: UpdateParams): Promise<number> {
        this.#logger.debug(
            'update: id=%d, album=%o, version=%s',
            id,
            album,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Album mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(album, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Album)) {
            return validateResult;
        }

        const albumNeu = validateResult;
        const merged = this.#repo.merge(albumNeu, album);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Ein Album wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Albums
     * @returns true, falls das Album vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const album = await this.#readService.findById({
            id,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Album zur gegebenen ID mit Interpret und Abb. asynchron loeschen

            const interpretId = album.interpret?.id;
            if (interpretId !== undefined) {
                await transactionalMgr.delete(Interpret, interpretId);
            }
            const songs = album.songs ?? [];
            for (const song of songs) {
                await transactionalMgr.delete(Song, song.id);
            }

            deleteResult = await transactionalMgr.delete(Album, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ ean }: Album): Promise<undefined> {
        this.#logger.debug('#validateCreate: ean=%s', ean);
        if (await this.#repo.existsBy({ ean })) {
            throw new EanExistsException(ean);
        }
    }

    async #sendmail(album: Album) {
        const subject = `Neues Album ${album.id}`;
        const interpret = album.interpret?.interpret ?? 'N/A';
        const body = `Das Album mit dem Interpret <strong>${interpret}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        album: Album,
        id: number,
        versionStr: string,
    ): Promise<Album> {
        this.#logger.debug(
            '#validateUpdate: album=%o, id=%s, versionStr=%s',
            album,
            id,
            versionStr,
        );
        if (!AlbumWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: album=%o, version=%d',
            album,
            version,
        );

        const albumDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = albumDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: albumDb=%o', albumDb);
        return albumDb;
    }
}
