import jwt from "jsonwebtoken";

// Secretul JWT folosit de aplicație
const JWT_SECRET = "geniuserp_auth_jwt_secret";

// Generăm un token JWT pentru un utilizator admin
const token = jwt.sign(
  {
    id: "d47ac10b-58cc-4372-a567-0e02b2c3d479", // ID-ul utilizatorului api_tester
    username: "api_tester",
    role: "admin",
    roles: ["admin"], // Adăugăm roles array pentru middleware RBAC
    companyId: "c8c2f2d0-5cde-4e46-a6e5-938171c02887" // ID-ul companiei asociate
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

console.log("Token JWT valid pentru testare:");
console.log(token);

// Salvăm token-ul într-un fișier pentru folosirea ulterioară
import { writeFileSync } from "fs";
writeFileSync("valid-token.txt", token);
console.log("\nToken-ul a fost salvat în fișierul valid-token.txt");

