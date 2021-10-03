"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv4 = void 0;
var fs_1 = __importDefault(require("fs"));
var google_auth_library_1 = require("google-auth-library");
var config = JSON.parse(fs_1.default.readFileSync("config.json").toString());
var gClient = new google_auth_library_1.OAuth2Client(config.CLIENT_ID);
exports.uuidv4 = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
};
exports.default = (function (message, ws, db) { return __awaiter(void 0, void 0, void 0, function () {
    var send, sendSuccess, sendError, funSendError, sendWrapArray, auth, users, appointments, ticket, payload, a, user_1, _a, isAuth, email, user, dayStart, functions;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log(message);
                send = function (m) {
                    console.log(m);
                    m.responseId = message.requestId;
                    ws.send(JSON.stringify(m));
                };
                sendSuccess = function () { return send({ success: true }); };
                sendError = function (errmsg) { return send({ error: errmsg }); };
                funSendError = function (errmsg) { return function (e) { sendError(errmsg); console.log(e); }; };
                sendWrapArray = function (items) { return send({ items: items }); };
                auth = db.collection("auth");
                users = db.collection("users");
                appointments = db.collection("appointments");
                if (!(message.request === "auth")) return [3 /*break*/, 6];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, gClient.verifyIdToken({ idToken: message.token, audience: [config.CLIENT_ID] })];
            case 2:
                ticket = _b.sent();
                payload = ticket.getPayload();
                if (!payload) {
                    sendError('cvg');
                    return [2 /*return*/];
                }
                a = exports.uuidv4();
                send({ auth: a });
                auth.insertOne({ uuid: a, email: payload.email });
                return [4 /*yield*/, users.findOne({ email: payload.email })];
            case 3:
                user_1 = _b.sent();
                if (user_1) {
                    return [2 /*return*/];
                }
                users.insertOne({
                    email: payload.email,
                    name: payload.name,
                    pfp: payload.picture,
                    isMentor: false,
                    bio: "",
                    type: "",
                    phone: "",
                    availableTimes: []
                });
                return [3 /*break*/, 5];
            case 4:
                _a = _b.sent();
                sendError('cvg');
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
            case 6: return [4 /*yield*/, auth.findOne({ uuid: message.auth })];
            case 7:
                isAuth = _b.sent();
                if (!isAuth) {
                    sendError('ena');
                    return [2 /*return*/];
                }
                else {
                    email = isAuth.email;
                }
                return [4 /*yield*/, users.findOne({ email: email })];
            case 8:
                user = _b.sent();
                dayStart = new Date();
                dayStart.setHours(0, 0, 0, 0);
                functions = {
                    getMentors: function () { return users.find({ isMentor: true }, { projection: { phone: false } }).toArray().then(sendWrapArray).catch(funSendError('cgm')); },
                    scheduleAppointment: function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            appointments.insertOne({ mentor: message.mentor, mentee: email, date: message.date, hour: message.hour, uuid: exports.uuidv4() });
                            sendSuccess();
                            return [2 /*return*/];
                        });
                    }); },
                    getUserName: function () { return users.findOne({ email: message.user }).then(function (u) { return send({ name: u.name }); }).catch(funSendError('cgu')); },
                    getUserPhone: function () { return users.findOne({ email: message.user }).then(function (u) { return send({ phone: u.phone }); }).catch(funSendError('cgu')); },
                    getAppointmentsForMentor: function () { return appointments.find({ mentor: message.email, date: { $gte: message.date, $lte: message.date + (86400 * 1000) } }).toArray().then(sendWrapArray).catch(funSendError('cga')); },
                    getSelf: function () { return send(user); },
                    getUpcoming: function () {
                        appointments.find({ $or: [{ mentee: user.email }, { mentor: user.email }], date: { $gte: dayStart.getTime() } }).toArray().then(sendWrapArray).catch(funSendError('cga'));
                    },
                    updateSelf: function () {
                        var setQuery = { $set: {} };
                        if (message.predicate === "email") {
                            sendError('cuu');
                        }
                        setQuery.$set[message.predicate] = message.value;
                        users.updateOne({ email: email }, setQuery);
                        sendSuccess();
                    },
                    updateImage: function () {
                        var imageData = message.image.replace(/^data:image\/\w+;base64,/, '');
                        var imagePath = "./userimages/" + exports.uuidv4() + ".jpg";
                        if (!fs_1.default.existsSync("./userimages"))
                            fs_1.default.mkdirSync("./userimages");
                        fs_1.default.writeFileSync(imagePath, imageData, { encoding: 'base64' });
                        users.updateOne({ email: email }, { $set: { pfp: imagePath.substr(1) } });
                        sendSuccess();
                    },
                    cancelAppointment: function () {
                        appointments.deleteOne({ $or: [{ mentee: user.email }, { mentor: user.email }], timestamp: message.uuid }).then(sendSuccess).catch(funSendError('cga'));
                    },
                    addAvailableTime: function () { return users.updateOne({ email: email }, { $push: { availableTimes: { date: message.day, fromTime: message.fromTime, toTime: message.toTime, uuid: message.id } } }).then(sendSuccess); },
                    removeAvailableTime: function () {
                        var availableTimes = user.availableTimes.filter(function (a) { return a.uuid !== message.id; });
                        users.updateOne({ email: email }, { $set: { availableTimes: availableTimes } });
                        sendSuccess();
                    }
                };
                try {
                    functions[message.request]();
                }
                catch (error) {
                    sendError('nvf');
                }
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=responder.js.map