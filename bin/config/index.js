"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _dotenvExtended = _interopRequireDefault(require("dotenv-extended"));
var _dotenvParseVariables = _interopRequireDefault(require("dotenv-parse-variables"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const env = _dotenvExtended.default.load({
    path: process.env.ENV_FILE,
    defaults: './config/.env.defaults',
    schema: './config/.env.schema',
    includeProcessEnv: true,
    silent: false,
    errorOnMissing: true,
    errorOnExtra: true,
    errorOnRegex: true
});
const parsedEnv = (0, _dotenvParseVariables).default(env);

const config = {
    morganLogger: parsedEnv.MORGAN_LOGGER,
    morganBodyLogger: parsedEnv.MORGAN_BODY_LOGGER,
    exmplDevLogger: parsedEnv.EXMPL_DEV_LOGGER
};
var _default = config;
exports.default = _default;

//# sourceMappingURL=index.js.map