"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.auth = auth;
var _user = _interopRequireDefault(require("../services/user"));
var _express = require("../../utils/express");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function auth(req, res, next) {
    const token = req.headers.authorization;
    _user.default.auth(token).then((authResponse)=>{
        if (!authResponse.error) {
            res.locals.auth = {
                userId: authResponse.userId
            };
            next();
        } else {
            (0, _express).writeJsonResponse(res, 401, authResponse);
        }
    }).catch((err)=>{
        (0, _express).writeJsonResponse(res, 500, {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error'
            }
        });
    });
}

//# sourceMappingURL=user.js.map