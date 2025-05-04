import { Admin } from "../models/admin.js";
import { hash } from "bcrypt";


export const superAdmin = async () => {
  const userName = "Elshirbini";
  const email = "ahmedalshirbini22@gmail.com";
  const phone = "010943553300";
  const password = "Aa@5527980098";
  const role = "superAdmin";

  const isExist = await Admin.findOne({ where: { email: email } });
  if (isExist) {
    return console.log({ message: "superAdmin is already existing" });
  }
  const hashedPass = await hash(password, 12);
  await Admin.create({ userName, email, phone, password: hashedPass, role });
  console.log({ message: "superAdmin is created" });
};
