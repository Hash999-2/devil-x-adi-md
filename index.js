const express = require("express");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const app = express();
app.use(express.json());

let sock;
let pairingRequested = false;


// ===============================
// START BOT
// ===============================

async function startBot(phoneNumber = null) {

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true
    });


    sock.ev.on("creds.update", saveCreds);


    // Pairing Code
    if (phoneNumber && !sock.authState?.creds?.registered) {

        setTimeout(async () => {

            try {

                let code = await sock.requestPairingCode(phoneNumber);

                console.log(
                    "PAIRING CODE:",
                    code
                );

            } catch (err) {

                console.log(
                    "Pairing error:",
                    err
                );

            }

        },3000);

    }


    sock.ev.on("connection.update", (update)=>{

        const { connection, lastDisconnect } = update;


        if(connection === "open"){

            console.log(
                "DEVIL X ADI CONNECTED ✅"
            );

        }


        if(connection === "close"){

            let reason =
            lastDisconnect?.error?.output?.statusCode;


            if(reason !== DisconnectReason.loggedOut){

                console.log(
                    "Reconnecting..."
                );

                startBot();

            } else {

                console.log(
                    "Logged out"
                );

            }

        }


    });


}


// ===============================
// PAIR API
// ===============================

app.post("/pair", async(req,res)=>{

    let { number } = req.body;


    if(!number){

        return res.json({
            status:false,
            message:"Number required"
        });

    }


    try{

        await startBot(number);


        res.json({

            status:true,

            message:
            "Pairing code requested. Check Render logs."

        });


    }catch(e){


        res.json({

            status:false,

            error:e.message

        });


    }


});



// ===============================
// HOME
// ===============================

app.get("/",(req,res)=>{

    res.send(
        "DEVIL X ADI BOT ONLINE 🔥"
    );

});



// ===============================
// SERVER
// ===============================

app.listen(3000,()=>{

    console.log(
        "Server running"
    );

});
