"use strict";
var _server = require("./utils/server");
(0, _server).createServer().then((server)=>{
    server.listen(3000, ()=>{
        console.info(`Listening on http://localhost:3000`);
    });
}).catch((err)=>{
    console.error(`Error: ${err}`);
});

//# sourceMappingURL=app.js.map