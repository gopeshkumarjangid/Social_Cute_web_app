require('dotenv').config(); // ✅ .env load

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; // ✅ .env se JWT_SECRET

const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", async (req, res) => {
  const posts = await postModel.find().populate("user").lean(); 
  let user = null;
  try {
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, JWT_SECRET); // ✅ .env se
    }
  } catch (err) {
    user = null;
  }

  res.render("home", {
    allPosts: posts,
    user: user
  });
});

app.get("/register",function(req,res){
    res.render("index");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/profile",IsLoggedIn,async function(req,res){
    let user =  await userModel.findOne({email : req.user.email}).populate("posts");
    res.render("profile",{user});
})

app.get("/like/:id",IsLoggedIn,async function(req,res){
    let post =  await postModel.findOne({_id : req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid) === -1){
     post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    
    await post.save();
    res.redirect(`/profile#post-${req.params.id}`);
})

app.get("/edit/:id",IsLoggedIn,async function(req,res){
    let post =  await postModel.findOne({_id : req.params.id}).populate("user");
    res.render("edit",{post});
})

app.get('/delete/:id',async function(req,res){
    await postModel.findByIdAndDelete(req.params.id);
    res.redirect(`/profile#post-${req.params.id}`);
})

app.post("/updatepost/:id",IsLoggedIn,async function(req,res){
    await postModel.findOneAndUpdate({_id : req.params.id},{content : req.body.content});
    res.redirect("/profile");
}) 

app.post("/createpost",IsLoggedIn,async function(req,res){
    let user =  await userModel.findOne({email : req.user.email});
    let {content} = req.body;
    let post = await postModel.create({
        user : user._id,
        content
    })
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect("/");
})

app.post("/create",async function(req,res){
   let {username,email,password} = req.body;
   let CreatedUser = await userModel.findOne({email});
   if(CreatedUser) return res.render("index", {
        message: "⚠️ User already registered. Please sign in.",
      });
   bcrypt.genSalt(10,function(err,salt){
    bcrypt.hash(password,salt,async function(err,hash){
     let user = await userModel.create({
                username,
                email,
                password: hash
            })
    let token = jwt.sign({ email:email,userid:user._id }, JWT_SECRET); // ✅ .env se
    res.cookie("token", token);
    res.redirect('/login');
    })
   })
})

app.post('/like/:postId', IsLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.postId);
  const userId = req.user._id;

  if (post.likes.includes(userId)) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  res.redirect(`/#post-${req.params.postId}`);
});

app.post("/login",async function(req,res){
   let {email,password} = req.body;
   let user = await userModel.findOne({email});
   if(!user)  return res.render("login", {
        message: "⚠️ Wrong Credential ! Please try Again",
      });
   bcrypt.compare(password,user.password,function(err,result){
    if(result){
    let token = jwt.sign({ email:email,userid:user._id }, JWT_SECRET); // ✅ .env se
    res.cookie("token", token);
    res.redirect("/profile");
    }
    else {
       res.render("login", {
        message: "⚠️ Wrong Credential ! Please try Again",
      });
    }
   })
})

// ✅ JWT verification middleware with error handling
function IsLoggedIn(req,res,next){
    if(!req.cookies.token) return res.render("login");

    try {
        let data = jwt.verify(req.cookies.token, JWT_SECRET);
        req.user = data;
        next();
    } catch (err) {
        return res.render("login");
    }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
