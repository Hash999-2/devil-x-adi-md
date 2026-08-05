const express = require("express");
const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
app.use(express.json());

let sock;

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async(update)=>{

        const { connection } = update;

        if(connection === "open"){
            console.log("DEVIL X ADI CONNECTED ✅");
        }

        if(connection === "close"){
            console.log("Reconnecting...");
            startBot();
        }
    });
}

startBot();


app.get("/", (req,res)=>{
    res.send("DEVIL X ADI BOT ONLINE 🔥");
});


app.listen(3000,()=>{
    console.log("Server running");
});
