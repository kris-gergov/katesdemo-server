"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
function auth(bearerToken) {
    return new Promise(function(resolve, reject) {
        const token = bearerToken.replace('Bearer ', '');
        if (token === 'fakeToken') {
            resolve({
                userId: 'fakeUserId'
            });
            return;
        }
        resolve({
            error: {
                type: 'unauthorized',
                message: 'Authentication Failed'
            }
        });
    });
}
var _default = {
    auth
};
exports.default = _default;

//# sourceMappingURL=user.js.map