import mongoose from "mongoose";

const user =  new mongoose.Schema({
    userName:{
        type:String,
        required: true
    },
    RerenceceID:{
        type:String,
        required: true
    },   
    email:{ 
        type:String,
        required: true
    },
    mobileNo:{
        type:Number,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    PanCardno:{
        type:String,
        required: true
    },
    AadharCardNo:{
        type:String,
        required: true
    },
    Role:{
        type:String,
        enum:['Admin','User'], 
        default:'User'
    },
    isActive:{
        type:Boolean,
        default:true
    },
    isBlock:{
        type:Boolean,
        default:false
    }, 
    
},  {
    timestamps: true
}
)
const User=mongoose.model('User',user)
export default User;