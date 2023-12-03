import Users from "../models/UserModel.js";
import argon2 from "argon2";
import path from "path";
import fs from "fs";

export const Login = async (req, res) => {
  const user = await Users.findOne({
    where: {
      email: req.body.email,
    },
  });

  if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });

  const match = await argon2.verify(user.password, req.body.password);

  if (!match) return res.status(400).json({ msg: "Password Salah" });
  req.session.userId = user.uuid;

  const uuid = user.uuid;
  const name = user.name;
  const email = user.email;
  const role = user.role;
  res.status(200).json({ uuid, name, email, role });
};

export const Logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(400).json({ msg: "Tidak dapat logout" });
    res.status(200).json({ msg: "Anda telah berhasil logout" });
  });
};

export const Register = async (req, res) => {
  const user = await Users.findOne({
    where: {
      email: req.body.email,
    },
  });

  if (user) return res.status(404).json({ msg: "Email sudah terdaftar" });

  const { name, email, password, confPassword } = req.body;
  if (password !== confPassword)
    return res.status(400).json({ msg: "Password Tidak sama" });

  const hashPassword = await argon2.hash(password);
  res.status(201).json({ msg: "Register Berhasil" });
  try {
    await Users.create({
      name: name,
      email: email,
      password: hashPassword,
      role: "user",
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const Me = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }
  const user = await Users.findOne({
    attributes: [
      "id",
      "uuid",
      "photo",
      "url",
      "name",
      "email",
      "norek",
      "nohp",
      "province",
      "citydistrict",
      "subdistrict",
      "address",
      "location",
      "role",
    ],
    where: {
      uuid: req.session.userId,
    },
  });

  if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });
  res.status(200).json(user);
};

export const updatePhotoMe = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  try {
    const user = await Users.findOne({
      where: {
        uuid: req.params.id,
      },
    });

    // if (req.session.userId !== user.uuid)
    //   return res.status(403).json({ msg: "Akses Terlarang" });

    if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });

    let fileName = "";
    let url = "";
    if (req.files === null) {
      fileName = Users.photo;
      url = Users.url;
    } else {
      const file = req.files.file;
      const fileSize = file.data.length;
      const ext = path.extname(file.name);
      fileName = file.md5 + ext;
      const allowedType = [".png", ".jpg", ".jpeg"];

      if (!allowedType.includes(ext.toLocaleLowerCase()))
        return res
          .status(422)
          .json({ msg: "Format Gambar harus berupa PNG, JPG, dan JPEG" });
      if (fileSize > 5000000)
        return res.status(422).json({ msg: "Maksimal Ukuran Gambar 5 MB" });

      const filepath = `./public/img/profile/${user.photo}`;
      if (user.photo && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      file.mv(`./public/img/profile/${fileName}`, (err) => {
        if (err) return res.status(500).json({ msg: err.message });
      });

      url = `${req.protocol}://${req.get("host")}/img/profile/${fileName}`;
    }

    await Users.update(
      {
        photo: fileName,
        url: url,
      },
      {
        where: {
          id: user.id,
        },
      }
    );
    res.status(200).json({ msg: "Foto Profil Berhasil di Edit" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateMe = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }
  try {
    const user = await Users.findOne({
      where: {
        uuid: req.params.id,
      },
    });

    if (req.session.userId !== user.uuid)
      return res.status(403).json({ msg: "Akses Terlarang" });
    if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });

    const {
      name,
      norek,
      nohp,
      province,
      citydistrict,
      subdistrict,
      address,
      location,
    } = req.body;

    await Users.update(
      {
        name: name,
        email: user.email,
        password: user.password,
        norek: norek,
        nohp: nohp,
        province: province,
        citydistrict: citydistrict,
        subdistrict: subdistrict,
        address: address,
        location: location,
      },
      {
        where: {
          id: user.id,
        },
      }
    );
    res.status(200).json({ msg: "Profil Berhasil di Edit" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
