const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helper');


app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);
app.use(express.urlencoded({ extended: true }));

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur", //not supposted to work
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk", //not supposted to work
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const user = users[req.session.user_id];
  const templateVars = {
    user: user,
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const userFound = getUserByEmail(email, users);

  if (!userFound || !bcrypt.compareSync(password, userFound.password)) {
    // use bcrypt.compareSync to check the password
    res.status(403).send("Incorrect email or password.");
    return;
  }

  req.session.user_id = userFound.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = {
    user: user,
  };
  res.render("register", templateVars);
});

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

  const hashedPassword = bcrypt.hashSync(password, 10); // hash the password

  users[userRandomID] = {
    id: userRandomID,
    email: email,
    password: hashedPassword, // save hashedPassword
  };

  req.session.user_id = userRandomID;
  res.redirect("/urls");
});

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

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("You must be logged in to shorten URLs.");
  }
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: longURL,
    userID: req.session.user_id,
  };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const urlId = req.params.id;

  if (!userId) {
    return res.status(401).send("Please log in to delete this URL.");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found.");
  }

  if (urlDatabase[urlId].userID !== userId) {
    return res
      .status(403)
      .send("You do not have permission to delete this URL.");
  }

  delete urlDatabase[urlId];
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlObject = urlDatabase[shortURL];

  if (!urlObject) {
    return res.status(404).send("The requested short URL does not exist.");
  }

  // Redirect to the long URL if it exists
  res.redirect(urlObject.longURL);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = {
    longURL: longURL,
    userID: req.session.user_id,
  };
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.send("Please log in or register to see your URLs.");
  }

  const user = users[userId];
  const userUrls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urlDatabase: userUrls,
    user: user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const urlId = req.params.id;

  if (!userId) {
    return res.status(401).send("Please log in to see this URL.");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found.");
  }

  if (urlDatabase[urlId].userID !== userId) {
    return res.status(403).send("You do not have permission to view this URL.");
  }

  const user = users[userId];
  const templateVars = {
    id: urlId,
    longURL: urlDatabase[urlId].longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users", (req, res) => {
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
