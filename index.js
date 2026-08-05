const express = require("express");
const pino = require("pino");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");


const app = express();

app.use(express.json());


let sock = null;
let starting = false;


// =====================
// WHATSAPP START
// =====================

async function startBot(number = null) {

    if (starting) {
        console.log("Bot already starting...");
        return;
    }

    starting = true;


    try {

        const { state, saveCreds } =
            await useMultiFileAuthState("./session");


        sock = makeWASocket({

            auth: state,

            logger: pino({
                level: "silent"
            }),

            browser: [
                "DEVIL X ADI",
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

                    const code =
                    await sock.requestPairingCode(
                        number
                    );


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



        sock.ev.on(
            "connection.update",
            (update)=>{


                const {
                    connection,
                    lastDisconnect
                } = update;



                if(connection === "open"){

                    console.log(
                        "DEVIL X ADI CONNECTED ✅"
                    );

                    starting = false;

                }



                if(connection === "close"){


                    starting = false;


                    const reason =
                    lastDisconnect
                    ?.error
                    ?.output
                    ?.statusCode;



                    if(
                        reason !== DisconnectReason.loggedOut
                    ){

                        console.log(
                            "Connection closed, reconnecting..."
                        );


                        setTimeout(()=>{

                            startBot();

                        },10000);


                    }else{

                        console.log(
                            "Logged out from WhatsApp"
                        );

                    }


                }


            }
        );



    }catch(err){

        starting = false;

        console.log(
            "START ERROR:",
            err.message
        );

    }

}



// =====================
// PAIRING
// =====================


app.get("/pair/:number",(req,res)=>{


    startBot(
        req.params.number
    );


    res.send(
        "Pairing started. Check Render logs."
    );


});



app.post("/pair",(req,res)=>{


    const number =
    req.body.number;


    if(!number){

        return res.json({

            status:false,

            message:"Number missing"

        });

    }


    startBot(number);


    res.json({

        status:true,

        message:"Started"

    });


});




// =====================
// HOME
// =====================


app.get("/",(req,res)=>{

    res.send(
        "DEVIL X ADI BOT ONLINE 🔥"
    );

});




// =====================
// SERVER
// =====================


app.listen(
    3000,
    ()=>{
        console.log(
            "Server running"
        );
    }
);
