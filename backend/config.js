import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const primaryUri = process.env.MONGODB_URI_PRIMARY || 'mongodb://127.0.0.1:27017/primary_students';
const secondaryUri = process.env.MONGODB_URI_SECONDARY || 'mongodb://127.0.0.1:27017/call_logs';

console.log('Connecting to Primary DB:', primaryUri);
const primaryConnection = mongoose.createConnection(primaryUri);

console.log('Connecting to Secondary DB:', secondaryUri);
const secondaryConnection = mongoose.createConnection(secondaryUri);

primaryConnection.on('connected', () => console.log('Mongoose connected to Primary Database'));
primaryConnection.on('error', (err) => console.error('Mongoose Primary Connection error:', err));

secondaryConnection.on('connected', () => console.log('Mongoose connected to Secondary Database'));
secondaryConnection.on('error', (err) => console.error('Mongoose Secondary Connection error:', err));

export const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : ['verosha@123', 'chethiya@123', 'hansani@123', 'vidul@123', 'seniru@123', 'senuka@123', 'amiru@123', 'sanithu@123'];
export { primaryConnection, secondaryConnection };
