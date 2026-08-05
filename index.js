const express = require("express");
const pino = require("pino");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const config = require("./config");

const app = express();

app.use(express.json());

let sock;
let isStarting = false;


// ===============================
// START BOT
// ===============================

async function startBot(number = null) {

    if (isStarting) {
        console.log("Already starting...");
        return;
    }

    isStarting = true;

    try {

        const { state, saveCreds } =
            await useMultiFileAuthState("./session2");


        sock = makeWASocket({

            auth: state,

            logger: pino({
                level: "silent"
            }),

            browser: [
                config.botName,
                "Chrome",
                "1.0.0"
            ]

        });


        sock.ev.on(
            "creds.update",
            saveCreds
        );


        if(number && !state.creds.registered){

            setTimeout(async()=>{

                try{

                    let code =
                    await sock.requestPairingCode(
                        number
                    );

                    console.log(
                        "===================="
                    );

                    console.log(
                        "PAIRING CODE:",
                        code
                    );

                    console.log(
                        "===================="
                    );


                }catch(err){

                    console.log(
                        "PAIR ERROR:",
                        err.message
                    );

                }


            },4000);

        }



        sock.ev.on(
            "connection.update",
            (update)=>{

                const {
                    connection,
                    lastDisconnect
                } = update;


                if(connection === "open"){

                    isStarting = false;

                    console.log(
                        "DEVIL X ADI CONNECTED ✅"
                    );

                }



                if(connection === "close"){

                    sock = null;
                    isStarting = false;


                    const reason =
                    lastDisconnect
                    ?.error
                    ?.output
                    ?.statusCode;



                    console.log(
                        "Connection closed",
                        reason
                    );


                    if(
                        reason !== DisconnectReason.loggedOut
                    ){

                        console.log(
                            "Restarting in 10 seconds..."
                        );


                        setTimeout(()=>{
                            startBot();
                        },10000);

                    }

                }


            }
        );



    }catch(err){

        console.log(
            "BOT ERROR:",
            err.message
        );

        sock = null;
        isStarting = false;

    }

}




// ===============================
// PAIR ROUTE
// ===============================


app.get(
"/pair/:number",
(req,res)=>{

    startBot(
        req.params.number
    );


    res.send(
        "PAIRING STARTED CHECK LOGS"
    );

});




// ===============================
// HOME
// ===============================


app.get(
"/",
(req,res)=>{

    res.send(
        "DEVIL X ADI BOT ONLINE 🔥"
    );

});




// ===============================
// SERVER
// ===============================


app.listen(
3000,
()=>{

    console.log(
        "Server running"
    );

});
