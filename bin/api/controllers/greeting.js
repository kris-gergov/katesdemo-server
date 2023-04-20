"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.hello = hello;
exports.goodbye = goodbye;
var _express = require("../../utils/express");
function hello(req, res) {
    const name = req.query.name || 'stranger';
    (0, _express).writeJsonResponse(res, 200, {
        message: `Hello, ${name}!`
    });
}
function goodbye(req, res) {
    const userId = res.locals.auth.userId;
    (0, _express).writeJsonResponse(res, 200, {
        message: `Goodbye, ${userId}!`
    });
}

//# sourceMappingURL=greeting.js.map