import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI_PRIMARY;

if (!uri) {
  console.error("No MONGODB_URI_PRIMARY found in environment.");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log("Connecting to primary cluster...");
    await client.connect();
    console.log("Connected successfully. Fetching database list...");
    
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    
    console.log("\nAvailable Databases & Collections on your cluster:");
    console.log("==================================================");
    
    for (const dbInfo of dbsList.databases) {
      // Skip system databases to keep output clean unless they have collections
      if (['admin', 'local', 'config'].includes(dbInfo.name)) {
        continue;
      }
      
      console.log(`\n📁 Database: ${dbInfo.name}`);
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log("  (No collections found)");
      } else {
        collections.forEach(col => {
          console.log(`  - 📄 ${col.name}`);
        });
      }
    }
    console.log("==================================================");
    
  } catch (err) {
    console.error("Error connecting or listing databases:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
