import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// We will force connection to 'sme25' database for inspection
const baseUri = process.env.MONGODB_URI_PRIMARY;
if (!baseUri) {
  console.error("No MONGODB_URI_PRIMARY found in environment.");
  process.exit(1);
}

// Ensure the URI points to the 'sme25' database
let uri = baseUri;
if (uri.includes('?')) {
  const [parts, query] = uri.split('?');
  if (parts.endsWith('/')) {
    uri = `${parts}sme25?${query}`;
  } else {
    // If it has some database already named, replace it
    const lastSlashIndex = parts.lastIndexOf('/');
    uri = `${parts.substring(0, lastSlashIndex)}/sme25?${query}`;
  }
} else {
  if (uri.endsWith('/')) {
    uri = `${uri}sme25`;
  } else {
    const lastSlashIndex = uri.lastIndexOf('/');
    uri = `${uri.substring(0, lastSlashIndex)}/sme25`;
  }
}

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log("Connecting to database: sme25...");
    await client.connect();
    
    const db = client.db('sme25');
    const collection = db.collection('sme26registrations');
    
    console.log("Fetching sample document...");
    const sample = await collection.findOne();
    
    if (!sample) {
      console.log("No registrations found in 'sme26registrations' collection.");
    } else {
      console.log("\nSample Registration Document Fields:");
      console.log("====================================");
      console.log(JSON.stringify(sample, null, 2));
      console.log("====================================");
    }
    
  } catch (err) {
    console.error("Error inspecting database:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
