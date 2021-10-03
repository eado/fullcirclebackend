"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("Starting fullcircle server...");
var ws_1 = __importDefault(require("ws"));
var https_1 = __importDefault(require("https"));
var http_1 = __importDefault(require("http"));
var fs_1 = __importDefault(require("fs"));
var responder_1 = __importDefault(require("./responder"));
var mongodb_1 = require("mongodb");
var url_1 = __importDefault(require("url"));
var path_1 = __importDefault(require("path"));
var config = JSON.parse(fs_1.default.readFileSync("config.json").toString());
var client = new mongodb_1.MongoClient(config.prod ? config.mongodb : "mongodb://localhost:27017", { useUnifiedTopology: true });
var httpserver;
var filesystem = function (req, res) {
    var _a;
    console.log(req.method + " " + req.url);
    // parse URL
    var parsedUrl = url_1.default.parse(req.url ? req.url : "");
    // extract URL path
    var pathname = "./fullcircle/build" + parsedUrl.pathname;
    if ((_a = parsedUrl.pathname) === null || _a === void 0 ? void 0 : _a.startsWith("/userimages")) {
        pathname = "." + parsedUrl.pathname;
    }
    // based on the URL path, extract the file extension. e.g. .js, .doc, ...
    var ext = path_1.default.parse(pathname).ext;
    // maps file extention to MIME typere
    var map = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    };
    fs_1.default.exists(pathname, function (exist) {
        if (!exist) {
            // if the file is not found, return 404
            res.statusCode = 404;
            res.end("File " + pathname + " not found!");
            return;
        }
        // if is a directory search for index file matching the extention
        if (fs_1.default.statSync(pathname).isDirectory())
            pathname += '/index.html';
        // read file from file system
        fs_1.default.readFile(pathname, function (err, data) {
            if (err) {
                res.statusCode = 500;
                res.end("Error getting the file: " + err + ".");
            }
            else {
                // if the file is found, set Content-type and send data
                res.setHeader('Content-type', map[ext] || 'text/html');
                res.end(data);
            }
        });
    });
};
var realserver;
if (config.prod2) {
    realserver = https_1.default.createServer({
        cert: fs_1.default.readFileSync(config.cert),
        key: fs_1.default.readFileSync(config.key)
    }, filesystem);
    httpserver = http_1.default.createServer({}, function (_, res) {
        res.end("<head><meta http-equiv=\"Refresh\" content=\"0; URL=https://myfullcircle.app\"></head>");
    });
}
else {
    realserver = http_1.default.createServer(filesystem);
}
var wss = new ws_1.default.Server({ server: realserver });
wss.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.on('pong', function () { ws.isAlive = true; });
    ws.on('message', function incoming(message) {
        var json = JSON.parse(message);
        responder_1.default(json, ws, client.db("fullcircle"));
    });
});
// Alive listener
var interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false)
            return ws.terminate();
        ws.isAlive = false;
        ws.ping(function () { ws.isAlive = true; });
    });
}, 30000);
client.connect(function () {
    if (config.prod2) {
        httpserver.listen(80);
        realserver.listen(443);
    }
    else {
        realserver.listen(process.env.PORT || 8080);
    }
    // Index creation
    var db = client.db("fullcircle");
    // const products = db.collection("products")
    // products.createIndex({'sku': 1}, {unique: true})
    // products.createIndex({'name': "text", "brand": "text"})
    // products.createIndex({'category': 1, 'subcategory': 1})
    // const categories = db.collection("categories")
    // categories.createIndex({'name': 1}, {unique: true})
    // const orders = db.collection("orders")
    // orders.createIndex({'timestamp': -1})
    // orders.createIndex({'uuid': 1}, {unique: true})
    // orders.createIndex({'name': 1})
    var auth = db.collection("auth");
    auth.createIndex({ "uuid": 1 }, { unique: true });
    console.log("WebSocket server listening on port " + (config.prod ? 443 : 80) + "...");
});
function execSync(arg0) {
    throw new Error('Function not implemented.');
}
//# sourceMappingURL=main.js.map