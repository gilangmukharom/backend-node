import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import SequelizeStore from "connect-session-sequelize";
import fileUpload from "express-fileupload";
import UserRoute from "./routes/UserRoute.js";
import ProductRoute from "./routes/ProductRoute.js";
import SaveProductRoute from "./routes/SaveProductRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import SuggestionRoute from "./routes/SuggestionRoute.js";
import AgreementProducts from "./routes/AgreementProductsRoute.js";
import IsRentingProducts from "./routes/IsRentingProductsRoute.js";
import FinishRentByOwner from "./routes/FinishRentByOwnerRoute.js";
import FinishRentByRenter from "./routes/FinishRentByRenterRoute.js";
import Chats from "./routes/ChatsRoute.js";
import Searchs from "./routes/SearchRoute.js";
import Suggestions from "./routes/SuggestionRoute.js";
import Comments from "./routes/CommentsRoute.js";
import db from "./config/Database.js";
dotenv.config();

const app = express();

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
  db: db,
});

// (async () => {
//   await db.sync();
// })();

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      secure: "auto",
    },
  })
);

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:3001"],
  })
);

app.use(express.json());
app.use(fileUpload());
app.use(express.static("public"));
app.use(UserRoute);
app.use(ProductRoute);
app.use(SaveProductRoute);
app.use(SuggestionRoute);
app.use(AuthRoute);
app.use(AgreementProducts);
app.use(IsRentingProducts);
app.use(FinishRentByOwner);
app.use(FinishRentByRenter);
app.use(Chats);
app.use(Searchs);
app.use(Suggestions);
app.use(Comments);

// store.sync();

app.listen(process.env.APP_PORT, () => {
  console.log("server up and running ...");
});
