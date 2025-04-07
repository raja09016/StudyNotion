const nodemailer = require("nodemailer");
require("dotenv").config() ;
const mailSender = async (email,title,body)=>{
    
    try{
        let transporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS,
            }
        })
        
        let info = await transporter.sendMail({
            from:`Studynotion || By Raja`,
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log("info",info);
        return info;
    }
    catch(error){

     console.log(error.message);
     console.log("...")

    }
}

module.exports = mailSender;