// @eslint-community/eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
    type Album,
    type AlbumArt,
} from '../../src/album/entity/album.entity.js';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type GraphQLFormattedError } from 'graphql';
import { type GraphQLRequest } from '@apollo/server';
import { HttpStatus } from '@nestjs/common';

// eslint-disable-next-line jest/no-export
export interface GraphQLResponseBody {
    data?: Record<string, any> | null;
    errors?: readonly [GraphQLFormattedError];
}

type AlbumDTO = Omit<
    Album,
    'abbildungen' | 'aktualisiert' | 'erzeugt' | 'rabatt'
> & {
    rabatt: string;
};

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';

const interpretVorhanden = 'Lizzo';
const teilInterpretVorhanden = 'nd';
const teilInterpretNichtVorhanden = 'abc';

const eanVorhanden = '5901234123457';

const ratingVorhanden = 1;
const ratingNichtVorhanden = 99;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            // auch Statuscode 400 als gueltigen Request akzeptieren, wenn z.B.
            // ein Enum mit einem falschen String getestest wird
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Album zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    album(id: "${idVorhanden}") {
                        version
                        ean
                        rating
                        art
                        titel
                        preis
                        lieferbar
                        erscheinungsdatum
                        homepage
                        genres
                        interpret {
                            interpret
                        }
                        rabatt(short: true)
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { album } = data.data!;
        const result: AlbumDTO = album;

        expect(result.interpret?.interpret).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Album zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    album(id: "${id}") {
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.album).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt kein Album mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('album');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Album zu vorhandenem Interpret', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        interpret: "${interpretVorhanden}"
                    }) {
                        art
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { alben } = data.data!;

        expect(alben).not.toHaveLength(0);

        const albenArray: AlbumDTO[] = alben;

        expect(albenArray).toHaveLength(1);

        const [album] = albenArray;

        expect(album!.interpret?.interpret).toBe(interpretVorhanden);
    });

    test('Album zu vorhandenem Teil-Interpret', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        interpret: "${teilInterpretVorhanden}"
                    }) {
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { alben } = data.data!;

        expect(alben).not.toHaveLength(0);

        const albenArray: AlbumDTO[] = alben;
        albenArray
            .map((album) => album.interpret)
            .forEach((interpret) =>
                expect(interpret?.interpret.toLowerCase()).toEqual(
                    expect.stringContaining(teilInterpretVorhanden),
                ),
            );
    });

    test('Album zu nicht vorhandenem Interpret', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        interpret: "${teilInterpretNichtVorhanden}"
                    }) {
                        art
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.alben).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Alben gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('alben');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Album zu vorhandener EAN', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        ean: "${eanVorhanden}"
                    }) {
                        ean
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { alben } = data.data!;

        expect(alben).not.toHaveLength(0);

        const albenArray: AlbumDTO[] = alben;

        expect(albenArray).toHaveLength(1);

        const [album] = albenArray;
        const { ean, interpret } = album!;

        expect(ean).toBe(eanVorhanden);
        expect(interpret?.interpret).toBeDefined();
    });

    test('Alben zu vorhandenem "rating"', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        rating: ${ratingVorhanden},
                        interpret: "${teilInterpretVorhanden}"
                    }) {
                        rating
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { alben } = data.data!;

        expect(alben).not.toHaveLength(0);

        const albenArray: AlbumDTO[] = alben;

        albenArray.forEach((album) => {
            const { rating, interpret } = album;

            expect(rating).toBe(ratingVorhanden);
            expect(interpret?.interpret.toLowerCase()).toEqual(
                expect.stringContaining(teilInterpretVorhanden),
            );
        });
    });

    test('Kein Album zu nicht-vorhandenem "rating"', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        rating: ${ratingNichtVorhanden}
                    }) {
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.alben).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Alben gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('alben');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Alben zur Art "LIVEALBUM"', async () => {
        // given
        const albumArt: AlbumArt = 'LIVEALBUM';
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        art: ${albumArt}
                    }) {
                        art
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { alben } = data.data!;

        expect(alben).not.toHaveLength(0);

        const albenArray: AlbumDTO[] = alben;

        albenArray.forEach((album) => {
            const { art, interpret } = album;

            expect(art).toBe(albumArt);
            expect(interpret?.interpret).toBeDefined();
        });
    });

    test('Alben zur einer ungueltigen Art', async () => {
        // given
        const albumArt = 'UNGUELTIG';
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        art: ${albumArt}
                    }) {
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.BAD_REQUEST);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeUndefined();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { extensions } = error;

        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });

    test('Alben mit lieferbar=true', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    alben(suchkriterien: {
                        lieferbar: true
                    }) {
                        lieferbar
                        interpret {
                            interpret
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { alben } = data.data!;

        expect(alben).not.toHaveLength(0);

        const albenArray: AlbumDTO[] = alben;

        albenArray.forEach((album) => {
            const { lieferbar, interpret } = album;

            expect(lieferbar).toBe(true);
            expect(interpret?.interpret).toBeDefined();
        });
    });
});

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable max-lines */
