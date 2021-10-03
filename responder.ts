import WebSocket from 'ws';
import { Db } from 'mongodb';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

const config = JSON.parse(fs.readFileSync("config.json").toString())
const gClient = new OAuth2Client(config.CLIENT_ID)

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
    console.log(message)
    const send = (m: any) => {
        console.log(m)
        m.responseId = message.requestId
        ws.send(JSON.stringify(m))
    }
    const sendSuccess = () => send({success: true})
    const sendError = (errmsg: string) => send({error: errmsg})
    const funSendError = (errmsg: string) => (e: any) => {sendError(errmsg); console.log(e)}
    const sendWrapArray = (items: any[]) => send({items})


    const auth = db.collection("auth")
    const users = db.collection("users")
    const appointments = db.collection("appointments")
    const images = db.collection("images")

    if (message.request === "auth") {
        try {
            const ticket = await gClient.verifyIdToken({idToken: message.token, audience: [config.CLIENT_ID]})

            const payload = ticket.getPayload()
            if (!payload) {
                sendError('cvg')
                return
            }
            const a = uuidv4()
            send({auth: a})
            auth.insertOne({uuid: a, email: payload.email})

            let user = await users.findOne({email: payload.email})
            if (user) {
                return
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
            })
        } catch {
            sendError('cvg')
        }
        return
    }

    const isAuth = await auth.findOne({uuid: message.auth})
    let email: string
    if (!isAuth) {
        sendError('ena')
        return
    } else {
        email = isAuth.email
    }
    const user = await users.findOne({email})

    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)

    const functions: IData = {
        getMentors: () => users.find({isMentor: true}, {projection: {phone: false}}).toArray().then(sendWrapArray).catch(funSendError('cgm')),
        scheduleAppointment: async () => {
            appointments.insertOne({mentor: message.mentor, mentee: email, date: message.date, hour: message.hour, uuid: uuidv4()})
            sendSuccess()
        },
        getUserName: () => users.findOne({email: message.user}).then(u => send({name: u.name})).catch(funSendError('cgu')),
        getUserPhone: () => users.findOne({email: message.user}).then(u => send({phone: u.phone})).catch(funSendError('cgu')),
        getAppointmentsForMentor: () => appointments.find({mentor: message.email, date: {$gte: message.date, $lte: message.date + (86400 * 1000)}}).toArray().then(sendWrapArray).catch(funSendError('cga')),
        getSelf: () => send(user),
        getUpcoming: () => {
            appointments.find({$or: [{mentee: user.email}, {mentor: user.email}], date: {$gte: dayStart.getTime()}}).toArray().then(sendWrapArray).catch(funSendError('cga'))
        },
        updateSelf: () => {
            const setQuery = {$set: {} as any}
            if (message.predicate === "email") {
                sendError('cuu')
            }
            setQuery.$set[message.predicate] = message.value
            users.updateOne({email}, setQuery)
            sendSuccess()
        },
        updateImage: () => {
            const imageData = message.image.replace(/^data:image\/\w+;base64,/, '')
            const uuid = uuidv4()
            const imagePath = `./userimages/${uuid}.jpg`
            // if (!fs.existsSync("./userimages")) fs.mkdirSync("./userimages")
            // fs.writeFileSync(imagePath, imageData, {encoding: 'base64'})
            images.insertOne({filename: `${uuid}.jpg`, data: Buffer.from(imageData, "base64")})
            users.updateOne({email}, {$set: {pfp: imagePath.substr(1)}})
            sendSuccess()
        },
        cancelAppointment: () => {
            appointments.deleteOne({$or: [{mentee: user.email}, {mentor: user.email}], timestamp: message.uuid}).then(sendSuccess).catch(funSendError('cga'))
        },
        addAvailableTime: () => users.updateOne({email}, {$push: {availableTimes: {date: message.day, fromTime: message.fromTime, toTime: message.toTime, uuid: message.id}}}).then(sendSuccess),
        removeAvailableTime: () => {
            const availableTimes = user.availableTimes.filter((a: any) => a.uuid !== message.id)
            users.updateOne({email}, {$set: {availableTimes}})
            sendSuccess()
        }
    }

    try {
        functions[message.request]()
    } catch (error) {
        sendError('nvf')
    }
}