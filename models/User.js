import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Please provide a name"], 
        minlength: 3, 
        maxlength: 20, 
        trim: true 
    },
    lastName: { 
        type: String,  
        trim: true, 
        maxlength: 20,
        default: "lastName"
    },
    email: { 
        type: String, 
        required: [true, "Please provide an email"], 
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please provide valid email'
        }
    },
    password: { 
        type: String, 
        required: [true, "Please provide a password"], 
        minlength: 6,
        select:false
    }
})

UserSchema.pre('save', async function(){
    
  // Only run this function if password was actually modified
    if (!this.isModified('password')) return
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt); 
})

UserSchema.methods.createJWT = function(){
    return jwt.sign({userId: this._id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_LIFETIME})
}

UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    return isMatch
  }

export default mongoose.model('User', UserSchema)