const date = require(__dirname + "/date.js");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 11;

const homeStartingContent = "Wanna write something down today?";
const aboutContent =
  "This is a web diary system, feel free to wrtite something here.";
const contactContent =
  "For more details, please send an email to lingpeng.xiao@gmail.com";

const app = express();
const day = date.getDate();

app.set("view engine", "ejs"); //Enable ejs
app.use(bodyParser.urlencoded({ extended: true })); //Enable body-parser
app.use(express.static("public")); //Enable server to work with static codes.

//Connect database, create postDB
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
});

//Build post structure
const postSchema = {
  title: {
    type: String,
    required: [true, "Please add a title."],
  },
  content: {
    type: String,
  },
  date: String,
  userEmail: String,
};

//Build collection called posts
const Post = mongoose.model("Post", postSchema);

//Build user schema
const userSchema = {
  email: {
    type: String,
    required: [true, "Please add an email."],
  },
  password: {
    type: String,
    required: [true, "Please add a password."],
  },
};
//Build collection called posts
const User = mongoose.model("User", userSchema);

//Responce to the get homepage request from browser
app.get("/", (req, res) => {
  res.render("start");
});

app.get("/home", (req, res) => {
  const userEmail = req.query.valid;

  Post.find({ userEmail: userEmail }, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else {
      res.render("home", {
        startingContent: homeStartingContent,
        contents: foundItems,
        date: day,
        userEmail: userEmail,
      });
    }
  });
});

app.get("/about", (req, res) => {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", (req, res) => {
  res.render("contact", { contactContent: contactContent });
});

//Direct to add-post page.
app.get("/compose", (req, res) => {
  const email = req.query.userEmail;
  //New post, id is empty by now.
  res.render("compose", { id: "", userEmail: email });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

//Receive the post request from compose page.
app.post("/compose", (req, res) => {
  const id = req.body.id;
  const title = req.body.postTitle;
  const content = req.body.postContent;
  const date = day;
  const userEmail = req.body.userEmail;

  //id === "" means this post is new.
  if (id === "") {
    //If title isn't empty, add new post.
    if (title !== "") {
      const newPost = Post({
        userEmail: userEmail,
        title: title,
        content: content,
        date: date,
      });
      newPost.save(); //Add new post.
    } else {
      //For empty title, show error message, adding unsuccessfully.
      console.log("Sorry, the title cannot be empty.");
    }
  }
  //id isn't empty,which means this post needs to be changed
  else {
    Post.findOneAndUpdate(
      { _id: id },
      { title: title, content: content, date: date },
      (err, foundList) => {
        if (!err) {
          console.log(title + " was successfully changed.");
        }
      }
    );
  }
  //Go back to the homepage.
  const email = encodeURIComponent(userEmail);
  res.redirect("/home?valid=" + email);
});

//Dynamic response
//Use for safety reason, using POST method to pass id.
app.post("/posts/:title", (req, res) => {
  const id = req.body.id;
  const email = req.body.userEmail;
  Post.findById(id, (err, post) => {
    if (err) {
      console.log(err);
    } else {
      //Everything is OK! Show the posts.
      res.render("post", {
        id: id,
        title: post.title,
        date: post.date,
        content: post.content,
        userEmail: email,
      });
    }
  });
});

//This function delete the post by id
app.post("/edit", (req, res) => {
  const id = req.body.id;
  const email = req.body.userEmail;
  //For editing a post userEmail isn't needed.
  res.render("compose", { id: id, userEmail: email });
});

//This function delete the post by id
app.post("/delete", (req, res) => {
  const id = req.body.id;
  const userEmail = req.body.userEmail;
  //Delete post by id
  Post.findByIdAndDelete(id, (err, deletedPost) => {
    if (err) {
      console.log(err);
    } else {
      console.log(deletedPost.title + " was successfully deleted.");
    }
  });

  //Go back to the homepage.
  const email = encodeURIComponent(userEmail);
  res.redirect("/home?valid=" + email);
});

//This function responses the register request.
app.post("/register", (req, res) => {
  const email = req.body.email;
  //Hash password.
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    //Check if email and password are empty.
    if (email !== "" && hash !== "") {
      //If the email already exits, show the error message.
      User.findOne({ email: email }, (err, foundUser) => {
        if (foundUser != null) {
          res.render("fail_message", { fail_msg: "This email already exits." });
        } else {
          //Everything ok, create this account.
          const newUser = new User({
            email: email,
            password: hash,
          });
          //Save new user
          newUser.save((err) => {
            if (err) {
              console.log(err);
            } else {
              //Go back to the homepage.
              const encodeEmail = encodeURIComponent(email);
              res.redirect("/home?valid=" + encodeEmail);
            }
          });
        }
      });
    }
  });
});

//This function responses the login request.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //Check if this email already exits.
  User.findOne({ email: email }, (err, foundUser) => {
    if (foundUser) {
      //Check password
      bcrypt.compare(password, foundUser.password, (err, result) => {
        //If input password matches the record.
        if (result) {
          //Show all data from the database.
          Post.find({ userEmail: email }, (err, foundItems) => {
            if (err) {
              console.log(err);
            } else {
              //Go back to the homepage.
              const encodeEmail = encodeURIComponent(email);
              res.redirect("/home?valid=" + encodeEmail);
            }
          });
        } else {
          //Password is incorrect, show fail msg.
          res.render("fail_message", {
            fail_msg: "Your password is incorrect.",
          });
        }
      });
    } else {
      //Email is incorrect, show fail msg.
      res.render("fail_message", {
        fail_msg: "Your account doesn't exist.",
      });
    }
  });
});

//Build connection.
app.listen(3000, function () {
  console.log("Server is running on port 3000");
});
