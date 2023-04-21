const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function urlsForUser(id) {
  const userUrls = {};
  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === id) {
      userUrls[urlId] = urlDatabase[urlId];
    }
  }
  return userUrls;
}


function getUserByEmail(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

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

const users = {};


app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect("/urls");
  }
  const user = users[req.cookies.user_id];
  const templateVars = {
    user: user,
  };
  res.render("login", templateVars);
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const userFound = getUserByEmail(email, users);
  
  if (!userFound || userFound.password !== password) {
    res.status(403).send('Incorrect email or password.');
    return;
  }
  
  res.cookie('user_id', userFound.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});


app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
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
  users[userRandomID] = {
    id: userRandomID,
    email: email,
    password: password,
  };

  res.cookie("user_id", userRandomID);
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  const user = users[req.cookies.user_id];
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).send("You must be logged in to shorten URLs.");
  }
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: longURL,
    userID: req.cookies.user_id,
  };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  const urlObject = urlDatabase[shortURL];

  if (!urlObject) {
    return res.status(404).send('The requested short URL does not exist.');
  }

  // Redirect to the long URL if it exists
  res.redirect(urlObject.longURL);
});


app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = {
    longURL: longURL,
    userID: req.cookies.user_id,
  };
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(401).send("Please log in or register to view URLs.");
  }
  const user = users[userId];
  const templateVars = {
    urlDatabase: urlDatabase,
    user: user,
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const urlId = req.params.id;

  if (!userId) {
    return res.status(401).send("Please log in to view this URL.");
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
