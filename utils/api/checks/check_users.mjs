import { postgres } from "postgres";

async function checkUsers() {
  console.log("Verificăm utilizatorii din baza de date...");
  
  try {
    // Se conectează la baza de date folosind variabila de mediu DATABASE_URL
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Variabila de mediu DATABASE_URL nu este setată");
    }
    
    console.log("Conectare la baza de date...");
    const sql = postgres(connectionString);
    
    // Interogare pentru a extrage utilizatorii
    console.log("Interoghează tabela de utilizatori...");
    const users = await sql`SELECT id, username, email, role FROM users`;
    
    console.log(`\nS-au găsit ${users.length} utilizatori în baza de date:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Închide conexiunea
    await sql.end();
  } catch (error) {
    console.error("Eroare la interogarea bazei de date:", error);
  }
}

checkUsers().catch(console.error);

