const path = require("path");
const express = require("express");
const session = require("express-session");
const {connectDB} = require("./config/db");

const cookieParser = require("cookie-parser");
var MemoryStore = require("memorystore")(session);
const morgan=require("morgan");
const bodyParser=require("body-parser");
require('dotenv').config();
//connect to DATABASE
connectDB(process.env.DATABASE_URL);


const app = express();
app.use(bodyParser.json({limit:'100mb'}));
app.use(bodyParser.urlencoded({limit:'100mb',extended:true,parameterLimit:100000}));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
process.env.TZ = "Asia/Kolkata";
app.set("view engine", "ejs");
app.set("views", "views");
const indexRouter = require("./routes/index");
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    resave:true,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  })
);
app.use('/public/images/', express.static('./public/images'));
app.use("/", indexRouter);
const PORT = process.env.PORT || 3033;
app.listen(
  PORT,
  console.log(`Server running in production mode on port ${PORT} at ${new Date()}`)
);
