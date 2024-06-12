// const User = require("../models/user.model");
import User from "../models/user.model.js";
// const { default: appError } = require("../utils/appError");
import appError from '../utils/appError.js'
import cloudinary from 'cloudinary';
import fs from 'fs/promises'
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';

const cookieOptions = {
    secure : true,
    maxAge : 7*24*60*60*1000,
    httpOnly : true

}

const register = async (req,res,next)=>{
    const {fullName, email, password} = req.body;
    if(!fullName || !email ||!password){
        return next(new appError("All fields needed!!",400));
    }
    const userExists = await User.findOne({email});
    if(userExists){
        return next(new appError("Email already registered",400));
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar:{
            public_id : email,
            secure_url : "sample.jpeg",
        }

    })

    if(!User){  
        return next(new appError("User could not be created",400));
    }

    //TODO : upload user picture
    console.log('File details > ',JSON.stringify(req.file))
    if(req.file){
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder : 'lms',
                width : 250,
                height : 250,
                gravity: 'faces',
                crop : 'fill'
            });
            console.log(result);
            if(result){
                console.log(user);
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
                fs.rm(`uploads/${req.file.filename}`)

            }

            //remove file from local server
        }catch(e){
            return next(new appError(e.message || "File not uploaded, please try again",500)); 
        }
    }




    await user.save();

    //get JWT token in cookie
    const token = await user.generateJWTToken();
    res.cookie('token', token , cookieOptions);

    user.password = undefined;
    console.log("Running till here")
    res.status(200).json({
        success : true,
        message : "User registered successfully",
        user
    })
}

const login = async (req,res,next)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return next(new appError("All fields are required",400));
    }

    const user = await User.findOne({
        email
    }).select('+password')

    if(!user || !user.comparePassword(password)){  //To do
        return next(new appError("Email or password do not match",400));
    }

    const token = await user.generateJWTToken();
    // console.log(token);
    user.password = undefined;
    res.cookie('token', token , cookieOptions);
    console.log(token)
    res.status(201).json({
        success : true,
        message : 'User signed in successfully',
        user
    })


}

const logout = (req,res)=>{
    res.cookie('token',null,{
        secure : true,
        maxAge : 0,
        httpOnly : true
    })

    res.status(200).json({
        success : true,
        message : 'User logged out successfully'
    })
}

const getProfile = async (req,res)=>{
    const user = await User.findById(req.user.id);
    const {token} = res.cookie
    console.log(token)
    res.status(200).json({
        success: true,
        message : 'User Details',
        user
    })
}


const forgotPassword = async (req,res,next)=>{
    const { email } = req.body;
    if(!email){
        return next(new appError('Enter email to proceed', 400))
    }

    const user = await User.findOne({ email });
    if(!user){
        return next(new appError('Email is not registered', 400)); 
    }

    console.log("Reached till here")
    const resetToken = await user.generatePasswordToken();
    await user.save();
    console.log(resetToken)


    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href = ${resetPasswordUrl} target = "_blank"> If above url does not work copy paste in tab in browser`;


    console.log(resetPasswordUrl);
    try{
        //TODO sendEmail
        await sendEmail(email,subject,message);
    }catch(e){
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;
        await user.save();
        return next(new appError(e.message,500));
    }

    res.status(200).json({
        success : true,
        message: `Reset password token has been sent to ${email} successfully` ,
    })
}

const resetPassword = async (req,res,next)=>{
    const {resetToken} = req.params;
    const {password} = req.body;

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log(forgotPasswordToken)
    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry : {$gt : Date.now()},
    })
    console.log(user)
    if(!user){
        return next(new appError('Token is invalid or expired!',400));
    }

    user.password = password;
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    await user.save()

    res.status(200).json({
        success : true,
        message : 'Password changed successfully',
    })

}

const changePassword = async function(req,res,next){
    const {oldPassword, newPassword} = req.body;
    console.log(oldPassword);
    console.log(newPassword);
    const {id} = req.user;
    if(!oldPassword || !newPassword){
        return next(new appError('All fileds are mandatory',400));
    }
    const user = await User.findById({id}).select('+password');
    if(!user){
        return next(new appError('User does not exists',400));
    }
    const isPasswordValid = await user.comparePassword(oldPassword);
    if(!isPasswordValid){
        return next(new appError('Invalid old Password',400));
    }

    user.password = newPassword;
    await user.save();

    user.password = undefined;
    res.status(200).json({
        success : true,
        message : 'Password changed successfully',
    })  

}

const updateUser = async function(req,res,next){
    const {fullName} = req.body;
    const {id} = req.user;
    console.log(id)

    const user = await User.findById(id);

    if(!user){
        return next(new appError('User does not exists',400));
    }

    if(fullName){
        user.fullName = fullName
    }

    if(req.file){

        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        
        const result = await cloudinary.v2.uploader.upload(req.file.path,{
            folder : 'lms',
            width : 250,
            height : 250,
            gravity: 'faces',
            crop : 'fill'
        });
        console.log(result);
        if(result){
            console.log(user);
            user.avatar.public_id = result.public_id;
            user.avatar.secure_url = result.secure_url;
            fs.rm(`uploads/${req.file.filename}`)

        }
    }

    await user.save();

    res.status(200).json({
        success : true,
        message : 'User details updated successfully',
    })

}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}