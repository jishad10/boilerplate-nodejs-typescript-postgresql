import path from 'path';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';


dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables.');
}


export default defineConfig({
  // Path to your schema file
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: connectionString,
  },
});