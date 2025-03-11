const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadToCloudinary } = require("../utils/imageUploader");
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, title, timeDuration, description } = req.body;
    const video = req.files.videoFile;
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const uploadDetails = await uploadToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    // create subSecton

    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });

    // update in section models
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: SubSectionDetails._id,
        },
      },
      { new: true }
    ).populate("subSection");

    return res.status(200).json({
      success: true,
      message: "SubSection created successfully",
      updatedSection,
    });
  } catch (err) {


    console.log(err);
    return res.status(500).json({
      success: false,
      message: "failed to create subSection",
    });
  }
};

exports.updateSubSection = async(req,res)=>{
    try{
        const { SubSectionId, title, timeDuration, description } = req.body;
        const video = req.files.videoFile;
        console.log(req.files.videoFile)
        console.log(req.body)
        if (!SubSectionId || !title || !timeDuration || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields required",
            });
        }
        const uploadDetails = await uploadToCloudinary(
            video,
            process.env.FOLDER_NAME
          );
          const updatedSubSection = await SubSection.findByIdAndUpdate(SubSectionId,{
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
          });
          return res.status(200).json({
            success: true,
            message: "subSection updated successfully",
            
          });
      
    }
    
    catch(err){
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "failed to update subSection",
        });

    }
}

exports.deleteSubSection = async(req,res)=>{
    try{

        let {subSectionId} = req.body;
        console.log(subSectionId)
        if(!subSectionId){            
            return res.status(500).json({
              success: false,
              message: "subSectionId required",
            });
        }
        // subSectionId = new mongoose.
        console.log(typeof(subSectionId))
        const ans1 =  await SubSection.findById(subSectionId)
      const ans =  await SubSection.findByIdAndDelete(subSectionId);
      console.log(ans1);
        return res.status(200).json({
            success: true,
            message: "SubSection deteled successfully",
            
          });
  
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Unable to delete subSection",
        });
    }
} 