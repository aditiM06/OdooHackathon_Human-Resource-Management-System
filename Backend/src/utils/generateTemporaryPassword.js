import crypto from "crypto";

export function generateTemporaryPassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#$!";

  const allCharacters =
    uppercase + lowercase + numbers + symbols;

  const requiredCharacters = [
    uppercase[crypto.randomInt(uppercase.length)],
    lowercase[crypto.randomInt(lowercase.length)],
    numbers[crypto.randomInt(numbers.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];

  while (requiredCharacters.length < 12) {
    requiredCharacters.push(
      allCharacters[crypto.randomInt(allCharacters.length)]
    );
  }

  return requiredCharacters
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}