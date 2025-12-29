/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly HA_HOST: string;
    readonly HA_TOKEN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
