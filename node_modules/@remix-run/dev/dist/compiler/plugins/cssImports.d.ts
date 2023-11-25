import esbuild from "esbuild";
import type { RemixConfig } from "../../config";
import type { Options } from "../options";
/**
 * This plugin loads css files with the "css" loader (bundles and moves assets to assets directory)
 * and exports the url of the css file as its default export.
 */
export declare function cssFilePlugin({ config, options, }: {
    config: RemixConfig;
    options: Options;
}): esbuild.Plugin;
