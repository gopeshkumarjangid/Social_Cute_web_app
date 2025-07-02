const mongoose = require('mongoose');

let postSchema = mongoose.Schema({

    user:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        },
    date:{
        type:Date,
        default:Date.now
        },
        content:String,
        likes:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'user'
            }
        ],
    
    
},
{
    timestamps:true
})

module.exports = mongoose.model('post',postSchema);