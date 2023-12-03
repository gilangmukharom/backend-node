import { Op, literal } from "sequelize";
import IsRentingProducts from "../models/IsRentingProductsModel.js";
import Products from "../models/ProductModel.js";
import Users from "../models/UserModel.js";
import moment from "moment-timezone";

export const getIsRentingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const parsedLimit = parseInt(limit, 10);

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { "$product.name$": { [Op.like]: `%${search}%` } },
        { "$owner.name$": { [Op.like]: `%${search}%` } },
        { "$renter.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const resp = await IsRentingProducts.findAndCountAll({
      attributes: [
        "id",
        "uuid",
        "amount",
        "time",
        "time_unit",
        "total_price",
        "status",
        "start_date",
        "end_date",
        "remaining_time",
      ],
      include: [
        {
          model: Products,
          attributes: ["id", "uuid", "name", "url", "guarantee"],
        },
        {
          model: Users,
          as: "owner",
          attributes: ["id", "uuid", "url", "name"],
        },
        {
          model: Users,
          as: "renter",
          attributes: ["id", "uuid", "url", "name", "nohp"],
        },
      ],
      where: whereClause,
      limit: parsedLimit,
      offset,
    });

    const totalPages = Math.ceil(resp.count / limit);

    res.status(200).json({
      totalPages,
      curentPage: parseInt(page),
      totalIsRentings: resp.count,
      isRentings: resp.rows,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getIsRentingProductsByOwner = async (req, res) => {
  try {
    const resp = await IsRentingProducts.findAll({
      attributes: [
        "id",
        "uuid",
        "amount",
        "time",
        "time_unit",
        "total_price",
        "status",
        "start_date",
        "end_date",
        "remaining_time",
      ],
      include: [
        {
          model: Products,
          attributes: ["id", "uuid", "name", "url", "guarantee"],
        },
        {
          model: Users,
          as: "owner",
          attributes: ["id", "uuid", "url", "name"],
        },
        {
          model: Users,
          as: "renter",
          attributes: ["id", "uuid", "url", "name", "nohp"],
        },
      ],
      where: {
        ownerId: req.userId,
      },
    });

    if (resp.length === 0) {
      return res
        .status(404)
        .json({ msg: "Tidak Ada Barang Sewa Sedang Berjalan" });
    }

    res.status(200).json(resp);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getIsRentingProductsByRenter = async (req, res) => {
  try {
    const resp = await IsRentingProducts.findAll({
      attributes: [
        "id",
        "uuid",
        "amount",
        "time",
        "time_unit",
        "total_price",
        "status",
        "start_date",
        "end_date",
        "remaining_time",
      ],
      include: [
        {
          model: Products,
          attributes: ["id", "uuid", "name", "url", "guarantee"],
        },
        {
          model: Users,
          as: "owner",
          attributes: ["id", "uuid", "url", "name"],
        },
        {
          model: Users,
          as: "renter",
          attributes: ["id", "uuid", "url", "name", "nohp"],
        },
      ],
      where: {
        renterId: req.userId,
      },
    });

    if (resp.length === 0) {
      return res
        .status(404)
        .json({ msg: "Tidak Ada Barang Sewa Sedang Berjalan" });
    }

    res.status(200).json(resp);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getIsRentingProductsById = async (req, res) => {
  try {
    const role = req.role;
    const resp = await IsRentingProducts.findOne({
      where: {
        uuid: req.params.id,
      },
      attributes: [
        "id",
        "uuid",
        "amount",
        "time",
        "time_unit",
        "total_price",
        "status",
        "start_date",
        "end_date",
        "remaining_time",
      ],
      include: [
        {
          model: Products,
          attributes: ["id", "uuid", "name", "url", "guarantee"],
        },
        {
          model: Users,
          as: "owner",
          attributes: [
            "id",
            "uuid",
            "url",
            "name",
            "nohp",
            "province",
            "citydistrict",
            "subdistrict",
            "address",
            "location",
          ],
        },
        {
          model: Users,
          as: "renter",
          attributes: ["id", "uuid", "url", "name", "nohp"],
        },
      ],
    });

    if (!resp) {
      return res
        .status(404)
        .json({ msg: "Barang Sedang Sewa Tidak Ditemukan" });
    }

    // if (
    //   (resp.owner.id !== req.userId || role !== "admin") &&
    //   (resp.renter === null || resp.renter.id !== req.userId)
    // ) {
    //   return res.status(403).json({ msg: "Akses Terlarang" });
    // }

    res.status(200).json(resp);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createIsRentingProduct = async (req, res) => {
  const {
    amount,
    time,
    time_unit,
    total_price,
    status,
    productId,
    ownerId,
    renterId,
  } = req.body;

  try {
    const currentTime = moment();
    const startDate = currentTime.format("dddd DD MMMM YYYY HH:mm:ss");

    let endDate = moment(startDate, "dddd DD MMMM YYYY HH:mm:ss");

    if (time_unit === "Hari") {
      endDate = endDate.add(time, "days");
    } else if (time_unit === "Jam") {
      endDate = endDate.add(time, "hours");
    }

    const formattedEndDate = endDate.format("dddd DD MMMM YYYY HH:mm:ss");

    await IsRentingProducts.create({
      amount,
      time,
      time_unit,
      total_price,
      start_date: startDate,
      end_date: formattedEndDate,
      status,
      productId,
      ownerId,
      renterId,
    });

    res.status(201).json({ msg: "Data Masuk Ke Proses Menyewakan" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: error.message });
  }
};

export const updateIsRentingProductStatus = async (req, res) => {
  const isRentingProduct = await IsRentingProducts.findOne({
    where: {
      uuid: req.params.id,
    },
  });

  const { amount, time, time_unit, total_price, status } = req.body;

  try {
    if (req.role === "admin") {
      await IsRentingProducts.update(
        {
          amount: amount,
          total_price: total_price,
          time: time,
          time_unit: time_unit,
          status: status,
        },
        {
          where: {
            id: isRentingProduct.id,
          },
        }
      );
    } else {
      await IsRentingProducts.update(
        {
          total_price: total_price,
          status: status,
        },
        {
          where: {
            id: isRentingProduct.id,
          },
        }
      );
    }

    res.status(200).json({ msg: "Status Barang Sewa Berhasil Diperbarui" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteIsRentingProduct = async (req, res) => {
  const isRentingProduct = await IsRentingProducts.findOne({
    where: {
      uuid: req.params.id,
    },
  });

  try {
    await isRentingProduct.destroy({
      where: { id: isRentingProduct.id },
    });

    res.status(200).json({ msg: "Data Sedang Menyewa Berhasil Dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
