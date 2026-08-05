const express = require("express");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const app = express();

app.use(express.json());

let sock = null;
let connecting = false;


// =======================
// START WHATSAPP
// =======================

async function startBot(number = null) {

    if (connecting) {
        console.log("Already connecting...");
        return;
    }

    connecting = true;

    try {

        const { state, saveCreds } =
        await useMultiFileAuthState("./session");


        sock = makeWASocket({

            auth: state,

            logger:
            pino({
                level:"silent"
            })

        });


        sock.ev.on(
            "creds.update",
            saveCreds
        );


        // Pairing code

        if(number && !state.creds.registered){

            setTimeout(async()=>{

                try{

                    let code =
                    await sock.requestPairingCode(number);

                    console.log(
                        "PAIRING CODE:",
                        code
                    );

                }catch(e){

                    console.log(
                        "PAIR ERROR:",
                        e.message
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



            if(connection === "open"){

                console.log(
                    "DEVIL X ADI CONNECTED ✅"
                );

                connecting=false;

            }



            if(connection === "close"){

                connecting=false;


                let reason =
                lastDisconnect
                ?.error
                ?.output
                ?.statusCode;



                if(reason !== DisconnectReason.loggedOut){

                    console.log(
                        "Reconnecting in 10 seconds..."
                    );


                    setTimeout(()=>{

                        startBot();

                    },10000);


                }else{

                    console.log(
                        "Logged out"
                    );

                }

            }


        });



    }catch(err){

        connecting=false;

        console.log(
            "START ERROR:",
            err.message
        );

    }

}



// =======================
// PAIR API
// =======================


app.post("/pair",async(req,res)=>{

    const number=req.body.number;


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
        "Pairing started check logs"

    });


});




// Browser test

app.get("/pair/:number",(req,res)=>{


    startBot(
        req.params.number
    );


    res.send(
        "Pairing started"
    );


});





// =======================
// HOME
// =======================

app.get("/",(req,res)=>{

    res.send(
        "DEVIL X ADI BOT ONLINE 🔥"
    );

});





app.listen(3000,()=>{

    console.log(
        "Server running"
    );

});
