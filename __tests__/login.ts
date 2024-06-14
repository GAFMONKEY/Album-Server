import { type AxiosInstance, type AxiosResponse } from 'axios';
import { httpsAgent, loginPath } from './testserver.js';
import { type GraphQLQuery } from './album/album-mutation.resolver.test.js';
import { type GraphQLResponseBody } from './album/album-query.resolver.test.js';

interface LoginResult {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token: string;
}

const usernameDefault = 'admin';
const passwordDefault = 'p'; // NOSONAR

export const loginRest = async (
    axiosInstance: AxiosInstance,
    username = usernameDefault,
    password = passwordDefault,
) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded', // eslint-disable-line @typescript-eslint/naming-convention
    };
    const response: AxiosResponse<LoginResult> = await axiosInstance.post(
        loginPath,
        `username=${username}&password=${password}`,
        { headers, httpsAgent },
    );
    return response.data.access_token;
};

export const loginGraphQL = async (
    axiosInstance: AxiosInstance,
    username: string = usernameDefault,
    password: string = passwordDefault,
): Promise<string> => {
    const body: GraphQLQuery = {
        query: `
            mutation {
                login(
                    username: "${username}",
                    password: "${password}"
                ) {
                    access_token
                }
            }
        `,
    };

    const response: AxiosResponse<GraphQLResponseBody> =
        await axiosInstance.post('graphql', body, { httpsAgent });

    const data = response.data.data!;
    return data.login.access_token; // eslint-disable-line @typescript-eslint/no-unsafe-return
};
