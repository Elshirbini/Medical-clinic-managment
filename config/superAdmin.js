import { Admin } from "../models/admin.js";
import { hash } from "bcrypt";
import asyncHandler from "express-async-handler";

export const superAdmin = asyncHandler(async () => {
  const name = "Elshirbini";
  const email = "ahmedalshirbini33@gmail.com";
  const phone = "01094355330";
  const password = "Aa@5527980098";
  const role = "superAdmin";

  const isExist = await Admin.findOne({ where: { email: email } });
  if (isExist) {
    return console.log({ message: "superAdmin is already existing" });
  }
  const hashedPass = await hash(password, 12);
  await Admin.create({ name, email, phone, password: hashedPass, role });
  console.log({ message: "superAdmin is created" });
});
