"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.expressDevLogger = void 0;
const expressDevLogger = (req, res, next)=>{
    const startHrTime = process.hrtime();
    console.log(`Request: ${req.method} ${req.url} at ${new Date().toUTCString()}, User-Agent: ${req.get('User-Agent')}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    const [oldWrite, oldEnd] = [
        res.write,
        res.end
    ];
    const chunks = [];
    res.write = function(chunk) {
        chunks.push(Buffer.from(chunk));
        oldWrite.apply(res, arguments);
    };
    res.end = function(chunk) {
        if (chunk) {
            chunks.push(Buffer.from(chunk));
        }
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
        console.log(`Response ${res.statusCode} ${elapsedTimeInMs.toFixed(3)} ms`);
        const body = Buffer.concat(chunks).toString('utf8');
        console.log(`Response Body: ${body}`);
        oldEnd.apply(res, arguments);
    };
    next();
};
exports.expressDevLogger = expressDevLogger;

//# sourceMappingURL=express_dev_logger.js.map