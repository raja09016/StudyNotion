const mongoose = require("mongoose");
require("dotenv").config ;

exports.connect = () =>{
    console.log("aaya");
    mongoose.connect(process.env.MONGODB_URL) 
    .then( ()=> { console.log("DB Conncted Successfully")})
    .catch( (error)=> {
         console.log("DB connection failed");
         console.error(error);
         process.exit(1);
        } )

}
     

