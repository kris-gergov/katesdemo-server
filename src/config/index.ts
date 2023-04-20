import dotenvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

const env = dotenvExtended.load({
  path: process.env.ENV_FILE,
  defaults: './.env.defaults',
  schema: './.env.schema',
  includeProcessEnv: true,
  silent: false,
  errorOnMissing: true,
  errorOnExtra: true,
  errorOnRegex: true,
});

const parsedEnv = dotenvParseVariables(env);

// Define log levels type (silent + Winston default npm)
type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

interface Config {
  privateKey: string;
  publicKey: string;
  mongo: {
    url: string;
    autoIndex: boolean;
  };
  morganLogger: boolean;
  morganBodyLogger: boolean;
  exmplDevLogger: boolean;
  loggerLevel: LogLevel;
  localCacheTtl: number;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  origin: string;
}

const config: Config = {
  privateKey: parsedEnv.PRIVATE_KEY as string,
  publicKey: parsedEnv.PUBLIC_KEY as string,
  mongo: {
    url: parsedEnv.MONGO_URL as string,
    autoIndex: parsedEnv.MONGO_AUTO_INDEX as boolean,
  },
  morganLogger: parsedEnv.MORGAN_LOGGER as boolean,
  morganBodyLogger: parsedEnv.MORGAN_BODY_LOGGER as boolean,
  exmplDevLogger: parsedEnv.EXMPL_DEV_LOGGER as boolean,
  loggerLevel: parsedEnv.LOGGER_LEVEL as LogLevel,
  localCacheTtl: parsedEnv.LOCAL_CACHE_TTL as number,
  accessTokenTtl: parsedEnv.ACCESS_TOKEN_TTL as string,
  refreshTokenTtl: parsedEnv.REFRESH_TOKEN_TTL as string,
  origin: parsedEnv.ORIGIN as string
};

export default config;
