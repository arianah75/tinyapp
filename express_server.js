const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { users, urlDatabase } = require("./db");
const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("./helper");

app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);
app.use(express.urlencoded({ extended: true }));

// Login page
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: user,
  };
  res.render("login", templateVars);
});

// Registration page
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = {
    user: user,
  };
  res.render("register", templateVars);
});

// Create new URL page
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const user = users[req.session.user_id];
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// URL list page
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.status(401).send("Please log in to view your URLs.");
  }
  const userUrls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urls: userUrls,
    user: user,
  };
  res.render("urls_index", templateVars);
});

// URL edit page
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlData = urlDatabase[shortURL];

  if (!urlData) {
    return res.status(404).send("URL not found.");
  }

  if (!userId) {
    return res.status(401).send("Please log in to edit URLs.");
  }

  if (urlData.userID !== userId) {
    return res.status(403).send("You do not have permission to edit this URL.");
  }

  const user = users[userId];
  const templateVars = {
    id: shortURL,
    longURL: urlData.longURL,
    user: user,
  };

  res.render("urls_show", templateVars);
});

// URL redirection
app.get("/u/:shortURL", (req, res) => {
  const urlData = urlDatabase[req.params.shortURL];

  if (!urlData) {
    return res.status(404).send("URL not found.");
  }

  res.redirect(urlData.longURL);
});

// Redirect when we have no endpoint
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Login handler
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userFound = getUserByEmail(email, users);

  if (!userFound || !bcrypt.compareSync(password, userFound.password)) {
    res.status(403).send("Incorrect email or password.");
    return;
  }

  req.session.user_id = userFound.id;
  res.redirect("/urls");
});

// Logout handler
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Registration handler
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  const userFound = getUserByEmail(email, users);

  if (userFound) {
    res.status(400).send("Email already registered.");
    return;
  }

  const userRandomID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[userRandomID] = {
    id: userRandomID,
    email: email,
    password: hashedPassword,
  };

  req.session.user_id = userRandomID;
  res.redirect("/urls");
});

// Add new URL handler
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.status(401).send("Please log in to create a new URL.");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId,
  };

  res.redirect(`/urls/${shortURL}`);
});

// Update URL handler
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlData = urlDatabase[shortURL];

  if (urlData.userID !== userId) {
    return res.status(403).send("Unauthorized access.");
  }

  urlData.longURL = req.body.longURL;
  res.redirect("/urls");
});

// Delete URL handler
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlData = urlDatabase[shortURL];

  if (urlData.userID !== userId) {
    return res.status(403).send("Unauthorized access.");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Server start
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
