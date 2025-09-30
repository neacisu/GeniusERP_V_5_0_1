import jwt from "jsonwebtoken";

// Generăm un token JWT pentru un utilizator admin cu un companyId existent
const token = jwt.sign(
  {
    id: "123e4567-e89b-12d3-a456-426614174000", // ID-ul utilizatorului admin_test
    role: "admin",
    email: "admin_test@testcompany.ro",
    companyId: "c23e4567-e89b-12d3-a456-426614174000" // ID-ul companiei asociate
  },
  "your_jwt_secret_key_here", // Folosim o cheie secret standard pentru testare
  { expiresIn: "1h" }
);

console.log("Token JWT generat pentru testare:");
console.log(token);

// Salvăm token-ul într-un fișier pentru folosirea ulterioară
import { writeFileSync } from "fs";
writeFileSync("auth-token.txt", token);
console.log("\nToken-ul a fost salvat în fișierul auth-token.txt");

