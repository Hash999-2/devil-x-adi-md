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


// ======================
// START WHATSAPP BOT
// ======================

async function startBot(number = null) {

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true
    });


    sock.ev.on("creds.update", saveCreds);


    if(number){

        setTimeout(async()=>{

            try{

                const code = await sock.requestPairingCode(number);

                console.log(
                    "PAIRING CODE:",
                    code
                );

            }catch(err){

                console.log(
                    "PAIR ERROR:",
                    err.message
                );

            }

        },5000);

    }


    sock.ev.on("connection.update",(update)=>{

        const {connection,lastDisconnect}=update;


        if(connection==="open"){

            console.log(
                "DEVIL X ADI CONNECTED ✅"
            );

        }


        if(connection==="close"){

            const reason =
            lastDisconnect?.error?.output?.statusCode;


            if(reason !== DisconnectReason.loggedOut){

                console.log(
                    "Restarting..."
                );

                startBot();

            }

        }


    });


}



// ======================
// PAIR API
// ======================

app.post("/pair",async(req,res)=>{

    const {number}=req.body;


    if(!number){

        return res.json({
            status:false,
            message:"Number required"
        });

    }


    startBot(number);


    res.json({

        status:true,

        message:
        "Pairing started. Check logs."

    });


});



// Browser test
app.get("/pair/:number",(req,res)=>{

    startBot(req.params.number);


    res.send(
        "Pairing started. Check Render logs."
    );

});



// ======================
// HOME
// ======================

app.get("/",(req,res)=>{

    res.send(
        "DEVIL X ADI BOT ONLINE 🔥"
    );

});



// ======================
// SERVER
// ======================

app.listen(3000,()=>{

    console.log(
        "Server running"
    );

});
