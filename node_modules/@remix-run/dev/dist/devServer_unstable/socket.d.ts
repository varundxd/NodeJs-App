import { type Manifest } from "../manifest";
import type * as HMR from "./hmr";
export declare let serve: (options: {
    port: number;
}) => {
    log: (messageText: string) => void;
    reload: () => void;
    hmr: (assetsManifest: Manifest, updates: HMR.Update[]) => void;
    close: (cb?: ((err?: Error | undefined) => void) | undefined) => void;
};
