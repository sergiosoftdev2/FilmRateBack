import { hash, compare } from "bcrypt";

export async function generateHashedPassword(password) {
  const saltRounds = 10;
  return await hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  const isMatch = compare(password, hash);
  return isMatch;
}