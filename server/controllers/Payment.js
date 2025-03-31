const {instance} = require("../config/razorpay");
const Course =  require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");

// capture the payment and initiate the razorpay order 

exports.capturePayment = async(req,res)=>{
  
        const {course_id} = req.body;
        const userId = req.user.id ;

        // validation
        if(!course_id){
            return res.json({
                success:false,
                message:"Please provide a valid course Id",
            })
        }

        // valid course details
        let course;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.json({
                    success:false,
                    message:"Could not find the course",
                })
            }
            // user alreadyv buyed or not this course find using enrolled student 
            // conert the stringed user id to object id to find the student in enroller courses

            const uid =  mongoose.Types.ObjectId(userId);
              if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:"Student is already enrolled",
                })
              }
        }
        
        catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message ,
            })
        }

        // order creation
        const amount = course.price;
        const currency ="INR";
        const options = {
            amount : amount * 100 ,
             currency,
             receipt : Math.random( Date.now() ).toString,
             notes:{
                courseId : course_id,
                userId,
             }
        } ;

        try{
            // initiate the payment using razorpay
            const paymentResponse = await instance.orders.create(options)
            console.log(paymentResponse);
           
            return res.status(200).json({
                success:true,
                courseName:course.courseName,
                courseDescription : course.courseDescription,
                thumbnail:course.thumbnail,
                orderId : paymentResponse.id,
                currency:paymentResponse.currency,
                amount:paymentResponse.amount,

            })
        }
        catch(err){
            console.log(err);
            return res.status(500).json({
                success:false,
                message:"Could not initiate order" ,
            })
        }

}



// verify Signature of RazorPay and Server
exports.verifySignature = async(req,res)=>{
    // server secret
    const webhookSecret = "123456" ; 

    const signature = req.headers("x-razorpay-signature") ;
    crypto.createHmac("sha256",webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");
    if(signature == digest){
        console.log("payment is Authorised");

        const{courseId ,userId } = req.body.payload.payment.entity.notes;
        try{
            // ab course buy ho chuka h to enrolled student me daal do aur user ke course me daal do
            const enrolledCourse = await Course.findOneAndUpdate(
                                                            {_id:courseId},
                                                            {
                                                                $push:{studentsEnrolled:userId}
                                                            },
                                                            {new:true},
                                                         );

             if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:"Course not found" ,
                });
             }     
        console.log("enrolledCourse",enrolledCourse);
                 
        // find the student and push this course
             const enrolledStudent = await User.findOneAndUpdate(
                                                                {_id:userId},
                                                                {$push:{courses:courseId}},
                                                                {new:true},
             );

             console.log("enrolledStudent",enrolledStudent);
            //  send mail of successfull course registration

            const emailResponse = await mailSender( enrolledStudent.email ,"Congratulations from Codehelp", "Congratulations, you are onboarded into new Corse")
             console.log("email response:",emailResponse);
             return res.status(200).json({
                success:true,
                message:"Signature verified and course added"
             })
        }
        catch(err){
            console.log(err)
            return res.status(500).json({
                success:false,
                message:err.message ,
            });

        }
    }

    else{
        return res.status(500).json({
            success:false,
            message:"Invalid response" ,
        });
    }

}