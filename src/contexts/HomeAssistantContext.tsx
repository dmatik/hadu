import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    Connection,
    createLongLivedTokenAuth,
    createConnection,
    subscribeEntities,
    callService,
    type HassEntities
} from 'home-assistant-js-websocket';

interface HAContextType {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    entities: HassEntities | null;
    config: { url: string; token: string } | null;
    setConfig: (config: { url: string; token: string } | null) => void;
    callService: (domain: string, service: string, serviceData?: object) => void;
    logout: () => void;
}

const HomeAssistantContext = createContext<HAContextType | undefined>(undefined);

const STORAGE_KEY = 'ha_config';

export const HomeAssistantProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfigState] = useState<{ url: string; token: string } | null>(() => {
        const envUrl = import.meta.env.HA_HOST;
        const envToken = import.meta.env.HA_TOKEN;

        if (envUrl && envToken) {
            return { url: envUrl, token: envToken };
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    });

    const [connection, setConnection] = useState<Connection | null>(null);
    const [entities, setEntities] = useState<HassEntities | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setConfig = (newConfig: { url: string; token: string } | null) => {
        if (newConfig) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        setConfigState(newConfig);
    };

    const logout = () => {
        if (connection) {
            connection.close();
        }
        setConnection(null);
        setEntities(null);
        setConfig(null);
    };

    useEffect(() => {
        if (!config) return;

        let conn: Connection;
        let unsubEntities: () => void;
        let mounted = true;

        const connect = async () => {
            setIsConnecting(true);
            setError(null);

            try {
                const auth = createLongLivedTokenAuth(config.url, config.token);

                conn = await createConnection({ auth });

                if (!mounted) {
                    conn.close();
                    return;
                }

                setConnection(conn);

                // Subscribe to entities
                unsubEntities = subscribeEntities(conn, (ent) => {
                    if (mounted) setEntities(ent);
                });

                // Listen for close
                conn.addEventListener('disconnected', () => {
                    if (mounted) {
                        setConnection(null);
                        setError('Disconnected from Home Assistant');
                    }
                });

                conn.addEventListener('ready', () => {
                    if (mounted) setError(null);
                });

            } catch (err: any) {
                console.error("Connection failed", err);
                if (mounted) {
                    setError(err.message || 'Failed to connect. Check URL/Token.');
                    setConnection(null);
                }
            } finally {
                if (mounted) setIsConnecting(false);
            }
        };

        connect();

        return () => {
            mounted = false;
            if (unsubEntities) unsubEntities();
            if (conn) conn.close();
        };
    }, [config]);

    const callHAService = (domain: string, service: string, serviceData?: object) => {
        if (!connection) return;
        callService(connection!, domain, service, serviceData);
    };

    return (
        <HomeAssistantContext.Provider value={{
            isConnected: !!connection && !!entities,
            isConnecting,
            error,
            entities,
            config,
            setConfig,
            callService: callHAService,
            logout
        }}>
            {children}
        </HomeAssistantContext.Provider>
    );
};

export const useHomeAssistant = () => {
    const context = useContext(HomeAssistantContext);
    if (context === undefined) {
        throw new Error('useHomeAssistant must be used within a HomeAssistantProvider');
    }
    return context;
};
