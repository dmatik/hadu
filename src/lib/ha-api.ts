import {
    Connection,
    createConnection,
    createLongLivedTokenAuth
} from 'home-assistant-js-websocket';

export type { HassEntities, HassEntity } from 'home-assistant-js-websocket';

export interface HAConnectionConfig {
    url: string;
    token: string;
}

export const connectToHA = async (config: HAConnectionConfig): Promise<Connection> => {
    const auth = createLongLivedTokenAuth(
        config.url,
        config.token
    );

    const connection = await createConnection({ auth });

    return connection;
};
