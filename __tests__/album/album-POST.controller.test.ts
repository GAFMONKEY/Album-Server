import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type AlbumDTO } from '../../src/album/rest/albumDTO.entity.js';
import { AlbumReadService } from '../../src/album/service/album-read.service.js';
import { type ErrorResponse } from './error-response.js';
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuesAlbum: AlbumDTO = {
    ean: '0602445706679',
    rating: 4,
    art: 'STUDIOALBUM',
    titel: 'TitelTest',
    preis: 99.99,
    rabatt: 0.123,
    lieferbar: true,
    erscheinungsdatum: '2022-02-28',
    homepage: 'https://post.rest',
    genres: ['ROCK', 'METAL'],
    interpret: {
        interpret: 'InterpretTest',
        geburtsdatum: '1987-05-05',
    },
    songs: [],
};
const neuesAlbumInvalid: Record<string, unknown> = {
    ean: 'falscher-EANcode??!',
    rating: -1,
    art: 'UNSICHTBAR',
    titel: 'Titel!?',
    preis: -1,
    rabatt: 2,
    lieferbar: true,
    erscheinungsdatum: '12345-123-123',
    homepage: 'anyHomepage',
    genres: ['TECHNO', 'POP'],
    interpret: {
        interpret: '?!',
        geburtsdatum: '12345-123-123',
    },
    songs: [],
};
const neuesAlbumEanExistiert: AlbumDTO = {
    ean: '0602445706679',
    rating: 1,
    art: 'LIVEALBUM',
    titel: 'TitelEanExistiert',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    erscheinungsdatum: '2022-02-28',
    homepage: 'https://post.ean/',
    genres: ['HARDSTYLE'],
    interpret: {
        interpret: 'InterpretEanExistiert',
        geburtsdatum: '2001-12-09',
    },
    songs: [],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('POST /rest', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Neues Album', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/rest',
            neuesAlbum,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(AlbumReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test('Neues Album mit ungueltigen Daten', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [
            expect.stringMatching(/^ean /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^art /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^rabatt /u),
            expect.stringMatching(/^erscheinungsdatum /u),
            expect.stringMatching(/^homepage /u),
            expect.stringMatching(/^interpret.interpret /u),
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuesAlbumInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Neues Album, aber die EAN existiert bereits', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<ErrorResponse> = await client.post(
            '/rest',
            neuesAlbumEanExistiert,
            { headers },
        );

        // then
        const { data } = response;

        const { message, statusCode } = data;

        expect(message).toEqual(expect.stringContaining('EAN'));
        expect(statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    test('Neues Album, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuesAlbum,
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('Neues Album, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuesAlbum,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
});
