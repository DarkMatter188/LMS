// const {Schema, model, now} = require('mongoose');
import { Schema, model, now } from 'mongoose';
// const bcrypt = require('bcrypt');
import bcrypt from 'bcryptjs'
// const jwt = require('jsonwebtoken')
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema({
    fullName: {
        type : String,
        required : [true,"Enter name to continue"],
        minLength : [5,"Name must be atleat 5 characters long"],
        maxLength : [20,"Name cannot be more than 20 characters"],
        lowercase : true,
        trim : true
    },
    email : {
        type: String,
        required : [true,"Email is required to continue"],
        unique: true,
        lowercase : true,
        trim :true,
        match : [
            /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i,
                "Please enter email in proper format",
            ]
    },
    password:{
        type: String,
        required: [true,"Password is required"],
        minLength  : [8, "Password must be atleast 8 characters long"],
        select : false,
    },

    role : {
        type : String,
        enum : ['USER','ADMIN'],
        default : 'USER',
    },
    avatar: {
        public_id :{
            type : String,
        },
        secure_url :{
            type : String
        }
    },

    forgotPasswordToken : String,
    forgotPasswordExpiry : Date,

    subscription : {
        id : String,
        status : String
    }
    
},
    {
        timestamps : true
    });

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }

    this.password = await bcrypt.hash(this.password,10);
})

userSchema.methods = {
    comparePassword : async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword,this.password)
    },

    generateJWTToken : function(){
        return jwt.sign(
            {id : this._id, role : this.role , email : this.email , subscription : this.subscription},
            process.env.JWT_SECRET,
            {
                expiresIn : process.env.JWT_EXPIRY
            },
            
        )
    },

    generatePasswordToken : async function(){
        const resetToken = crypto.randomBytes(20).toString('hex');
        this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex'),
        this.forgotPasswordExpiry = Date.now() + 15*60*1000; //15 min from now

        return resetToken;
    }
}

const User = model('User',userSchema);
// module.exports = User;
export default User;