const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('./models/user');
const path = require('path');

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());



app.get("/", async (req, res) => {
  const posts = await postModel.find().populate("user").lean(); // ✅ populated posts
  let user = null;
  try {
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, "secretkey");
    }
  } catch (err) {
    user = null;
  }

  res.render("home", {
    allPosts: posts, // ✅ fixed this line
    user: user        // ✅ use decoded user from JWT
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
    let user = await postModel.findByIdAndDelete(req.params.id);
    // res.send("server is running");
    res.redirect(`/profile#post-${req.params.id}`);
})
app.post("/updatepost/:id",IsLoggedIn,async function(req,res){
    let post =  await postModel.findOneAndUpdate({_id : req.params.id},{content : req.body.content});
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
            
    let token = jwt.sign({ email:email,userid:user._id }, "secretcode");
    res.cookie("token", token);
    // res.send("registeredUser");
    res.redirect('/login');
    })
    
   })
})
app.post('/like/:postId', IsLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.postId);
  const userId = req.user._id;

  if (post.likes.includes(userId)) {
    post.likes.pull(userId); // Unlike
  } else {
    post.likes.push(userId); // Like
  }

  await post.save();
res.redirect(`/#post-${req.params.id}`);

});

app.post("/login",async function(req,res){
   let {email,password} = req.body;
   let user = await userModel.findOne({email});
   if(!user)  return res.render("login", {
        message: "⚠️ Wrong Credential ! Please try Again",
      });
   bcrypt.compare(password,user.password,function(err,result){
    if(result){
    let token = jwt.sign({ email:email,userid:user._id }, "secretcode");
    res.cookie("token", token);
    // res.status(404).send("Now ! You can login");
    res.redirect("/profile");
    }
    else {
       res.render("login", {
        message: "⚠️ Wrong Credential ! Please try Again",
      });
    }
   })
})



// middleware
function IsLoggedIn(req,res,next){
    if(req.cookies.token === "") res.render("login");
    
    else{
        let data = jwt.verify(req.cookies.token,"secretcode");
        req.user = data;
        next();
    }
    
}

app.listen(3000);