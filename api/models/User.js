import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    googleId:{
        type: String,
    },
    fname: {
      type: String,
    },
    lname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    activationToken:String ,
    activationExpires:Date ,
    resetPasswordOTP: String,
    resetPasswordExpires: Date,
    date: {
      type: Date,
      require: true,
    },
    country: {
      type: String,
    },
    img: {
      type: String,
    },
    city: {
      type: String,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; 
      },
    },
    status: {
       type: String,
        enum: ['active', 'disabled','lock'], 
        default: 'disabled' 
      },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);