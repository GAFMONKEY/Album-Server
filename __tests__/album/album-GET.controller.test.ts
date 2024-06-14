import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type AlbenModel } from '../../src/album/rest/album-get.controller.js';
import { type ErrorResponse } from './error-response.js';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const interpretVorhanden = 'nd';
const interpretNichtVorhanden = 'xxx';
const genreVorhanden = 'pop';
const genreNichtVorhanden = 'radio';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Alben finden', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<AlbenModel> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data).toBeDefined();

        // eslint-disable-next-line no-underscore-dangle
        const { alben } = data._embedded;

        alben
            // eslint-disable-next-line no-underscore-dangle
            .map((album) => album._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'iu'));
            });
    });

    test('Album zu vorhandenem Interpret mit Teilstring', async () => {
        // given
        const params = { interpret: interpretVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<AlbenModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // eslint-disable-next-line no-underscore-dangle
        const { alben } = data._embedded;

        alben
            .map((album) => album.interpret)
            .forEach((interpret) => {
                expect(interpret.interpret.toLowerCase()).toEqual(
                    expect.stringContaining(interpretVorhanden),
                );
            });
    });

    test('Kein Album zu nicht-vorhandenem Interpret mit Teilstring', async () => {
        // given
        const params = { interpret: interpretNichtVorhanden };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Album mit vorhandenem Genre', async () => {
        // given
        const params = { [genreVorhanden]: 'true' };

        // when
        const { status, headers, data }: AxiosResponse<AlbenModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();
    });

    test('Kein Album mit nicht vorhandenem Genre', async () => {
        // given
        const params = { [genreNichtVorhanden]: 'true' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Kein Album zu nicht vorhandener Property', async () => {
        // given
        const params = { radio: 'true' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
});
