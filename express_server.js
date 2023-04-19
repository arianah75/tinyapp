const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

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


// Add body-parser middleware to parse the POST request body
app.use(express.urlencoded({ extended: true }));


// app.post("/urls", (req, res) => {
//   console.log(req.body); // Log the POST request body to the console
//   res.send("Ok"); // Respond with 'Ok' (we will replace this)
// });

// POST route to receive form submission and save longURL and shortURL to urlDatabase
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});


//redirect to longURL when short URL is used. @ victor 
app.get("/u/:id", (req, res) => {
  const longURL= urlDatabase[req.params.id];
  res.redirect(longURL);
});

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

app.get("/urls", (req, res) => {

  res.render("urls_index", { urlDatabase } );
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id,
  longURL: urlDatabase[req.params.id] };

  res.render("urls_show", templateVars);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});