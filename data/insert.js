// import { MongoClient } from "mongodb";
// import fs from "fs";

// // Charger les données JSON
// const users = JSON.parse(fs.readFileSync("users.json", "utf8"));

// // Connexion à MongoDB
// const uri = "mongodb://localhost:27017"; 
// const client = new MongoClient(uri);

// async function insertUsers() {
//   try {
//     await client.connect();
//     const database = client.db("users-intranet"); 
//     const collection = database.collection("users");

//     // Insérer les utilisateurs
//     const result = await collection.insertMany(users);
//     console.log(`${result.insertedCount} utilisateurs insérés avec succès.`);
//   } catch (error) {
//     console.error("Erreur lors de l'insertion :", error);
//   } finally {
//     await client.close();
//   }
// }

// // Exécuter l'insertion
// insertUsers();
