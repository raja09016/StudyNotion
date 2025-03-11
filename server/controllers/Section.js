const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body;
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Required all fields !",
      });
    }

    const newSection = await Section.create({ sectionName });

    // updat in course models;
    const updateCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    ).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec();


    return res.status(200).json({
      success: true,
      message: "Section created successfully",
      updateCourseDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "failed to create section",
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId } = req.body;

    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Required all fields !",
      });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        sectionName,
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "failed to update section",
    });
  }
};


exports.deleteSection = async(req,res)=>{
    try{
        const {sectionId,courseId}  = req.body;
        await Section.findByIdAndDelete(sectionId);
        await Course.findByIdAndDelete(courseId)
        return res.status(200).json({
            success: true,
            message: "Section delete successfully",
            
          });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
          success: false,
          message: "Unable to delete section",
        });
    }
}