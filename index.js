const express = require("express");

const app = express();

app.get("/", (req,res)=>{
    res.send("DEVIL X ADI BOT ONLINE");
});

app.listen(3000,()=>{
    console.log("Server running");
});
