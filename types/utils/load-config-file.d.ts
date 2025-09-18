/**
 * Loads the configuration file from the given path.
 * @param configPath - The path to the configuration file.
 * @returns The normalized configuration object.
 */
declare function loadConfig<T>(configPath: string): Promise<T | null>;
export { loadConfig };
