import { type RemixConfig } from "../config";
export declare let serve: (initialConfig: RemixConfig, options: {
    command: string;
    httpScheme: string;
    httpHost: string;
    httpPort: number;
    webSocketPort: number;
    restart: boolean;
}) => Promise<unknown>;
