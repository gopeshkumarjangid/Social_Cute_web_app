const mongoose = require('mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/data");



mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));


let userSchema = mongoose.Schema({
    username:String,
    email:String,
    password:String,
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'post'
        }
    ]
},
    {
        timestamps:true,
})

module.exports = mongoose.model('user',userSchema);