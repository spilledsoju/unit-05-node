const app = require("./index.js");
const port = 8080;

app.listen(port, function () {
  console.log(`Node server is running... http://localhost:${port}`);
});
