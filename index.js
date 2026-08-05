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


let sock = null;
let isConnected = false;
let pairingNumber = null;


// ===========================
// START WHATSAPP
// ===========================

async function startBot(number = null) {

    if (sock) {
        console.log("Socket already exists");
        return;
    }


    const {
        state,
        saveCreds
    } = await useMultiFileAuthState("./session");


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



    // Pairing Code

    if (
        number &&
        !state.creds.registered
    ) {

        pairingNumber = number;


        setTimeout(async()=>{

            try {

                const code =
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


            } catch(err) {


                console.log(
                    "PAIR ERROR:",
                    err.message
                );


            }


        },3000);

    }





    sock.ev.on(
        "connection.update",
        async(update)=>{


            const {
                connection,
                lastDisconnect
            } = update;



            if(connection === "open") {


                isConnected = true;


                console.log(
                    `${config.botName} CONNECTED ✅`
                );


            }





            if(connection === "close") {


                isConnected = false;


                sock = null;



                const reason =
                lastDisconnect
                ?.error
                ?.output
                ?.statusCode;



                console.log(
                    "Connection closed:",
                    reason
                );



                if(
                    reason !== DisconnectReason.loggedOut
                ){

                    console.log(
                        "Reconnecting..."
                    );


                    setTimeout(()=>{

                        startBot();

                    },10000);


                }
                else {

                    console.log(
                        "Logged out"
                    );

                }


            }



        }
    );


}





// ===========================
// PAIR API
// ===========================


app.get(
"/pair/:number",
(req,res)=>{


    startBot(
        req.params.number
    );


    res.send(
        "Pairing started. Check Render logs."
    );


});





app.post(
"/pair",
(req,res)=>{


    const number =
    req.body.number;



    if(!number){

        return res.json({

            status:false,

            message:
            "Number required"

        });

    }



    startBot(number);



    res.json({

        status:true,

        message:
        "Pairing started"

    });


});





// ===========================
// HOME
// ===========================


app.get(
"/",
(req,res)=>{

    res.send(
        `${config.botName} ONLINE 🔥`
    );

});





// ===========================
// SERVER
// ===========================


app.listen(
3000,
()=>{

    console.log(
        "Server running"
    );

});
