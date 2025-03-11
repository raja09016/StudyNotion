const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();


// auth
exports.auth = async (req,res,next)=>{
    try{
        // extract token
        const token = req.cookies.token || req.body.token || req.header("Authorisation").replace("Bearer","") 
        console.log("token",token);
        // if token missing , return res
       if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            })
       }

        // veriy token using secret key
       try{
            const decode =  jwt.verify(token,process.env.JWT_SECRET) ;
            console.log("decode",decode);
            // req ke andr decode jisme accountype h usko add krdo, taaki isStudent me accounttype verify kr ske
            req.user = decode;
            console.log(req.user);
       }
       catch(err){
        // verification issue 
            return res.status(401).json({
                success:false,
                message:"token is invalid" 
            })
       }
       next();
    }

    catch(error){
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validationg the tokken" 
        })

    }
}
// isStudent

exports.isStudent = async(req,res ,next) =>{
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Student only"
            })
        }

        // if verified 
        next();


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified , please try  again"

        })

    }
}


// isIstructor



exports.isInstructor = async(req,res ,next) =>{
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Instructor only"
            })
        }

        // if verified 
        next();


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified , please try  again"

        })

    }
}

// isAdmin



exports.isAdmin= async(req,res ,next) =>{
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for isAdmin only"
            })
        }

        // if verified 
        next();


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified , please try  again"

        })

    }
}


