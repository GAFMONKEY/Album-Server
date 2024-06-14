import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type AlbumDtoOhneRef } from '../../src/album/rest/albumDTO.entity.js';
import { type ErrorResponse } from './error-response.js';
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaendertesAlbum: AlbumDtoOhneRef = {
    ean: '0602445706679',
    rating: 4,
    art: 'LIVEALBUM',
    titel: 'TitelTest',
    preis: 99.99,
    rabatt: 0.123,
    lieferbar: true,
    erscheinungsdatum: '2022-02-02',
    homepage: 'https://post.rest',
    genres: ['ROCK', 'METAL'],
};
const idVorhanden = '30';

const geaendertesAlbumIdNichtVorhanden: AlbumDtoOhneRef = {
    ean: '0602445706679',
    rating: 4,
    art: 'LIVEALBUM',
    titel: 'Geaendert',
    preis: 44.4,
    rabatt: 0.044,
    lieferbar: true,
    erscheinungsdatum: '2022-02-04',
    homepage: 'https://acme.de',
    genres: ['PUT'],
};
const idNichtVorhanden = '999999';

const geaendertesAlbumInvalid: Record<string, unknown> = {
    ean: 'falsche-EAN!?',
    rating: -1,
    art: 'FALSCH',
    titel: 'Titel!?',
    preis: -1,
    rabatt: 2,
    lieferbar: true,
    datum: '12345-123-123',
    homepage: 'anyHomepage',
    genres: ['TECHNO'],
};

const veraltesAlbum: AlbumDtoOhneRef = {
    ean: '0602445706679',
    rating: 4,
    art: 'LIVEALBUM',
    titel: 'Geaendert',
    preis: 44.4,
    rabatt: 0.044,
    lieferbar: true,
    erscheinungsdatum: '2022-02-04',
    homepage: 'https://acme.de',
    genres: ['PUT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /rest/:id', () => {
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
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Vorhandenes Album aendern', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client, 'admin', 'p');
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geaendertesAlbum,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenes Album aendern', async () => {
        // given
        const url = `/rest/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const { status }: AxiosResponse<string> = await client.put(
            url,
            geaendertesAlbumIdNichtVorhanden,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);
    });

    test('Vorhandenes Album aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        const expectedMsg = [
            expect.stringMatching(/^ean /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^art /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^rabatt /u),
            expect.stringMatching(/^homepage /u),
        ];

        // when
        const { status, data }: AxiosResponse<Record<string, any>> =
            await client.put(url, geaendertesAlbumInvalid, { headers });

        // then
        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Vorhandenes Album aendern, aber ohne Versionsnummer', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geaendertesAlbum,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandenes Album aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.put(
            url,
            veraltesAlbum,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);

        const { message, statusCode } = data;

        expect(message).toMatch(/Versionsnummer/u);
        expect(statusCode).toBe(HttpStatus.PRECONDITION_FAILED);
    });

    test('Vorhandenes Album aendern, aber ohne Token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesAlbum,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('Vorhandenes Album aendern, aber mit falschem Token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesAlbum,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
});
