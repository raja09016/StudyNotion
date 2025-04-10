const express = require("express");
const app = express();

const UserRoutes = require("./routes/User")
const profileRoutes = require("./routes/Profile")
const paymentRoutes = require("./routes/Payments")
const courseRoutes = require("./routes/Course")
const contactUsRoute = require("./routes/Contact")
const {connect} = require("./config/database");


const cors = require("cors");
const {cloudinaryConnect} = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config() ; 
const PORT = process.env.PORT || 4000 ;

// db connect
connect();

// middlewares
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = ['http://localhost:3000', 'https://study-notion-ten-psi.vercel.app'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Include credentials if needed
}));

app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp",
    })
)

// cloudinary connection
cloudinaryConnect();

// routes
app.use("/api/v1/auth",UserRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/reach", contactUsRoute);

// default route

app.get( "/" , (req,res)=>{
    return res.json({
         success:true,
         message:"Your server is up and running",
    })
} )


app.listen(PORT , ()=>{
    console.log(`APP is running at ${PORT}`);
})




