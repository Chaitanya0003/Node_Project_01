const express = require("express");
const fs = require("node:fs");
const users = require("./MOCK_DATA.json");

const app = express();
const Port = 8000;

//Middleware
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log("Hello from middleware 1");
  req.myUserName = "Chaitanya Tiwadi";
  next();
});

app.use((req, res, next) => {
  console.log("Hello from middleware 2", req.myUserName);
  next();
});

app.use((req, res, next) => {
  fs.appendFile(
    "log.txt",
    `${new Date()} - ${req.method} -${req.url}\n`,
    (err, data) => {
      next();
    },
  );
});

// user data in JSON
app.get("/api/users", (req, res) => {
  console.log(req.headers);
  res.setHeader("X-MyName", "Chaitanya");
  return res.json(users);
});

// user data in html doc
app.get("/users", (req, res) => {
  const html = `
  <ul>
  ${users.map((user) => `<li>${user.first_name}</li>`).join("")}
  </ul>
  `;
  return res.send(html);
});

app
  .route("/api/users/:id")
  .get((req, res) => {
    const id = Number(req.params.id);
    const user = users.find((user) => user.id === id);
    if (!user) {
      return res.status(404).json({ msg: "user not found." });
    }
    return res.json(user);
  })
  .patch((req, res) => {
    //Edit user with ID
    const body = req.body;
    console.log("body", body);
    const updatedUsers = users.map((user) => {
      return user.id === Number(req.params.id)
        ? { ...user, last_name: body.last_name }
        : user;
    });
    fs.writeFile(
      "./MOCK_DATA.json",
      JSON.stringify(updatedUsers),
      (err, data) => {
        return res.json({ status: "success", id: req.params.id });
      },
    );
  })
  .delete((req, res) => {
    //delete user with ID
    let userList = JSON.parse(
      fs.readFileSync("./MOCK_DATA.json", "utf-8", (err, data) => {}),
    );
    const updatedUsers = userList.filter(
      (user) => user.id !== Number(req.params.id),
    );
    fs.writeFile(
      "./MOCK_DATA.json",
      JSON.stringify(updatedUsers),
      (err, data) => {
        return res.json({
          status: "Successfully deleted user with id: " + req.params.id,
        });
      },
    );
  });

//Create new user
app.post("/api/users", (req, res) => {
  const body = req.body;
  console.log("body", body);
  if (
    !body ||
    !body.first_name ||
    !body.last_name ||
    !body.email ||
    !body.job_title
  ) {
    return res.status(400).json({ msg: "Missing required fields." });
  }
  users.push({ ...body, id: users.length + 1 });
  fs.writeFile("./MOCK_DATA.json", JSON.stringify(users), (err, data) => {
    return res.status(201).json({ status: "success", id: users.length });
  });
});

app.listen(Port, () => console.log(`Served started on the Port: ${Port}`));
