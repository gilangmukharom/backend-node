import { Sequelize } from "sequelize";

const db = new Sequelize("rental_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

export default db;

// import { Sequelize } from "sequelize";
// import mysql2 from "mysql2";

// const db = new Sequelize(
//   process.env.DB_USERNAME,
//   process.env.DB_PASSWORD,
//   process.env.DB_DBNAME,
//   {
//     host: process.env.DB_HOST,
//     dialect: "mysql",
//     dialectModule: mysql2,
//   }
// );

// export default db;
