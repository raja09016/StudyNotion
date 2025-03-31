const User = require("../models/User")
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto")
// reset password token
exports.resetPasswordToken = async (req,res)=>{
    try{
        // fecth email
        const email = req.body.email;
        
        
        // validation and check user for this email
        const user = await User.findOne({email:email})
        

        if(!user){
            return res.json({
                success:false,
                meaasge:"Your Email is not registered"
            })
        }
        // generate token
        const token = crypto.randomBytes(20).toString("hex");

        // generate token
        const updatedDetails = await User.findOneAndUpdate(
                                                            {email:email},
                                                        {
                                                            token:token,
                                                            resetPasswordExpires:Date.now() + 5*60*1000
                                                        },{new:true}
                                                    )

                               
     console.log("DETAILS", updatedDetails);                                            
        //  create url   for frontend                                         
           const url = `http://localhost:3000/update-password/${token}`  ;
           
        //    send email;'
        await mailSender(email,"Passord reset Link" ,` Password Reset Link : ${url}`);
        // return res

        return res.json({
            success:true,
            message:"Email sent successfully , please check and change password  "
        })
    }
    catch(error){
        console.log("error during send mail to reset password",error);
        return res.status(500).json({
            success:false,
            message:" Something went wrong while sending reset password mail "
        })

    }
}

// reset password finally
exports.resetPassword = async (req,res)=>{
    try{
        // data fetching
        const{ password, confirmPassword, token}=req.body;

        // validation
        if(password !== confirmPassword){
            return res.json({
                success:false,
                message:"Password not matched "
            })
        }

        const userDetails = await User.findOne({token:token});

        if(!userDetails){
            return res.json({
                success:false,
                message:"Token invalid"
            });
        }

        // token time check
        if(userDetails.resetPasswordExpires < Date.now() ){
            // token expries
            return res.json({
                success:false,
                message:"Token is expired , please regenrate your tokrn to generate the reset password link"
            })
            
        }

        const hashedPassword = await bcrypt.hash(password,10);

        // password update

        await User.findOneAndUpdate(
                                {token:token},
                                {password:hashedPassword},
                                {new:true},
        );
        return res.status(200).json({
            success:true,
            message:"Password reset successfull "
        })

    }
    catch(error){
        console.log(error);
        return res.json({
            success:false,
            message:"Something went wrong while reseting password "
        })
    }
}