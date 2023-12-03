import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "../models/UserModel.js";
import Products from "../models/ProductModel.js";

const { DataTypes } = Sequelize;

const SaveProducts = db.define(
  "save_products",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

Users.hasMany(SaveProducts);
SaveProducts.belongsTo(Users, { foreignKey: "ownerId", as: "owner" });
SaveProducts.belongsTo(Users, { foreignKey: "userId", as: "user" });

Products.hasMany(SaveProducts);
SaveProducts.belongsTo(Products, {
  foreignKey: "productId",
  onDelete: "CASCADE",
});

export default SaveProducts;
