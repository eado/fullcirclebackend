console.log("Starting fullcircle server...")

import WebSocket from 'ws';
import https from 'https';
import http from 'http';
import fs from 'fs';
import responder from './responder';
import { MongoClient } from 'mongodb';
import url from 'url'
import path from 'path'

// execSync("mongod --dbpath /var/data/db &")

const client = new MongoClient("mongodb://localhost:27017", { useUnifiedTopology: true })

const files = JSON.parse(fs.readFileSync("config.json").toString())

const httpserver = http.createServer({}, (_, res) => {
  res.end(`<head><meta http-equiv="Refresh" content="0; URL=https://fullcircle.omarelamri.me/"></head>`)
})

const server = https.createServer({
    cert: fs.readFileSync(files.cert),
    key: fs.readFileSync(files.key)
}, function (req, res) {
    console.log(`${req.method} ${req.url}`);
  
    // parse URL
    const parsedUrl = url.parse(req.url ? req.url as string : "");
    // extract URL path
    let pathname = `./fullcircle/build${parsedUrl.pathname}`;
    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext;
    // maps file extention to MIME typere
    const map: {[key: string]: string} = {
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
  
    fs.exists(pathname, function (exist) {
      if(!exist) {
        // if the file is not found, return 404
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }
  
      // if is a directory search for index file matching the extention
      if (fs.statSync(pathname).isDirectory()) pathname += '/index.html';
  
      // read file from file system
      fs.readFile(pathname, function(err, data){
        if(err){
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          // if the file is found, set Content-type and send data
          res.setHeader('Content-type', map[ext] || 'text/html' );
          res.end(data);
        }
      });
    });
})

const wss = new WebSocket.Server({server})

wss.on('connection', function connection(ws: any) {
    (ws as any).isAlive = true;
    ws.on('pong', () => {(ws as any).isAlive = true});

    ws.on('message', function incoming(message: any) {

        const json = JSON.parse((message as string))

        responder(json, ws, client.db("fullcircle"))
    })
});

// Alive listener
const interval = setInterval(function ping() {
wss.clients.forEach(function each(ws: any) {
    if ((ws as any).isAlive === false) return ws.terminate();

    (ws as any).isAlive = false;
    ws.ping(() => {(ws as any).isAlive = true;});
});
}, 30000);

client.connect(() => {
    httpserver.listen(80)
    server.listen(443)

    // Index creation
    const db = client.db("fullcircle");

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
    
    const auth = db.collection("auth")
    auth.createIndex({"uuid": 1}, {unique: true})
    console.log("Secure WebSocket server listening on port 443...")
})