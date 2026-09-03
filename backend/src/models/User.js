const mongoose=require('mongoose');
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true},role:{type:String,enum:['USER','SUPER_ADMIN'],default:'USER'},status:{type:String,enum:['ACTIVE','DISABLED'],default:'ACTIVE'}},{timestamps:true});
module.exports=mongoose.model('User',schema);
