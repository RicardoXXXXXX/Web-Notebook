const date = require(__dirname + "/date.js");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

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
mongoose.connect("mongodb://localhost:27017/postDB", {
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
  date: {
    type: String,
  },
};

//Build collection called posts
const Post = mongoose.model("Post", postSchema);

//Responce to the get homepage request from browser
app.get("/", (req, res) => {
  //Show all data from the database.
  Post.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else {
      res.render("home", {
        startingContent: homeStartingContent,
        contents: foundItems,
        date: day,
      });
    }
  });
});

//Receive the post request from compose page.
app.post("/compose", (req, res) => {
  const id = req.body.id;
  const title = req.body.postTitle;
  const content = req.body.postContent;
  const date = day;

  //id === "" means this post is new.
  if (id === "") {
    //If title isn't empty, add new post.
    if (title !== "") {
      const newPost = Post({
        title: title,
        content: content,
        date: date,
      });
      newPost.save(); //Add new post.
    } else {
      //For empty title, show error message, adding unsuccessfully.
      console.log("Sorry, title cannot be empty.");
    }
  }
  //id isn't empty means this post needs to be changed
  else {
    Post.findOneAndUpdate(
      { _id: id },
      { title: title, content: content, date: date },
      (err, foundList) => {
        if (!err) {
          console.log(title + "is successfully changed");
        }
      }
    );
  }
  res.redirect("/"); //Go back to the homepage.
});

app.get("/about", (req, res) => {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", (req, res) => {
  res.render("contact", { contactContent: contactContent });
});

//Direct to add-post page.
app.get("/compose", (req, res) => {
  //New post, id is empty by now.
  res.render("compose", { id: "" });
});

//Dynamic response
//Use for safety reason, using POST method to pass id.
app.post("/posts/:title", (req, res) => {
  const id = req.body.id;
  Post.findById(id, (err, post) => {
    if (err) {
      console.log(err);
    } else {
      //Everything is OK! Show the posts.
      res.render("post", {
        id: post.id,
        title: post.title,
        date: post.date,
        content: post.content,
      });
    }
  });
});

//This function delete the post by id
app.post("/edit", (req, res) => {
  const id = req.body.id;
  res.render("compose", { id: id });
});

//This function delete the post by id
app.post("/delete", (req, res) => {
  const id = req.body.id;
  Post.findByIdAndDelete(id, (err, deletedPost) => {
    if (err) {
      console.log(err);
    } else {
      console.log(deletedPost.title + " is deleted.");
    }
  });

  //Go back to home page.
  res.redirect("/");
});

//Build connection.
app.listen(3000, function () {
  console.log("Server is running on port 3000");
});
