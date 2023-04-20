"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createServer = createServer;
var _express = _interopRequireDefault(require("express"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var OpenApiValidator = _interopRequireWildcard(require("express-openapi-validator"));
var _swaggerRoutesExpress = require("swagger-routes-express");
var _yamljs = _interopRequireDefault(require("yamljs"));
var _morgan = _interopRequireDefault(require("morgan"));
var _morganBody = _interopRequireDefault(require("morgan-body"));
var _config = _interopRequireDefault(require("../config"));
var api = _interopRequireWildcard(require("../api/controllers/index"));
var _expressDevLogger = require("./express_dev_logger");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache() {
    if (typeof WeakMap !== "function") return null;
    var cache = new WeakMap();
    _getRequireWildcardCache = function() {
        return cache;
    };
    return cache;
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache();
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
async function createServer() {
    const yamlSpecFile = './config/openapi.yml';
    const apiDefinition = _yamljs.default.load(yamlSpecFile);
    const apiSummary = (0, _swaggerRoutesExpress).summarise(apiDefinition);
    console.info(apiSummary);
    console.info('-----');
    console.info("CONFIG", _config.default);
    const server = (0, _express).default();
    server.use(_bodyParser.default.json());
    if (_config.default.morganLogger) {
        server.use((0, _morgan).default(':method :url :status :response-time ms - :res[content-length]'));
    }
    if (_config.default.morganBodyLogger) {
        (0, _morganBody).default(server);
    }
    if (_config.default.exmplDevLogger) {
        server.use(_expressDevLogger.expressDevLogger);
    }
    const validatorOptions = {
        apiSpec: yamlSpecFile,
        validateRequests: true,
        validateResponses: true
    };
    server.use(OpenApiValidator.middleware(validatorOptions));
    server.use((err, req, res, next)=>{
        res.status(err.status).json({
            error: {
                type: 'request_validation',
                message: err.message,
                errors: err.errors
            }
        });
    });
    const connect = (0, _swaggerRoutesExpress).connector(api, apiDefinition, {
        onCreateRoute: (method, descriptor)=>{
            descriptor.shift();
            console.log(`${method}: ${descriptor.map((d)=>d.name).join(', ')}`);
        },
        security: {
            bearerAuth: api.auth
        }
    });
    connect(server);
    return server;
}

//# sourceMappingURL=server.js.map