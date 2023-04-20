const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

function generateRandomString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};  

app.set("view engine", "ejs"); //set EJS as our view engine

app.use(cookieParser()); //using cookie-parsser

// Add body-parser middleware to parse the POST request body
app.use(express.urlencoded({ extended: true }));


// app.post("/urls", (req, res) => {
//   console.log(req.body); // Log the POST request body to the console
//   res.send("Ok"); // Respond with 'Ok' (we will replace this)
// });

app.post('/login', (req, res) => {
  const username = req.body.username;

  if (username) {
    // Set the 'username' cookie
    res.cookie('username', username);

    // Login successful, redirect the user to the desired page (e.g., /urls)
    res.redirect('/urls');
  } else {
    // Login failed, send an appropriate error message and status code
    res.status(401).send('Username is required.');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// POST route to receive form submission and save longURL and shortURL to urlDatabase
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req,res) => {
delete urlDatabase[req.params.id];
res.redirect("/urls");
});


app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect('/urls');
});

//redirect to longURL when short URL is used.
app.get("/u/:id", (req, res) => {
  const longURL= urlDatabase[req.params.id];
  res.redirect(longURL);
});



app.get("/urls", (req, res) => {
  const templateVars = {
    urlDatabase: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});