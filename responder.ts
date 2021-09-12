import WebSocket from 'ws';
import { Db } from 'mongodb';

interface IData {
    [ key: string ]: () => void;
}

export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}

export default async (message: any, ws: WebSocket, db: Db) => {
    const send = (m: any) => {
        m.responseId = message.requestId
        ws.send(JSON.stringify(m))
    }
    const sendSuccess = () => send({success: true})
    const sendError = (errmsg: string) => send({error: errmsg})
    const funSendError = (errmsg: string) => (e: any) => {sendError(errmsg); console.log(e)}
    const sendWrapArray = (items: any[]) => send({items})


    const auth = db.collection("auth")

    if (message.request === "auth") {
        return
    }

    const isAuth = await auth.findOne({uuid: message.auth})
    if (!isAuth) {
        sendError('ena')
        return
    }

    const functions: IData = {
        
    }

    try {
        functions[message.request]()
    } catch (error) {
        sendError('nvf')
    }
}