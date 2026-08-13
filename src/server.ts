import { app } from './app';
import config from './core/config/config';
import logger from './core/config/logger';
import prisma from './core/config/prisma';


const PORT = config.port;


const main = async () => {
  try {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables.');
    }

    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma (NeonDB)');

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

  } catch (error: any) {
    logger.error('Error starting server:', error.message || error);
    await prisma.$disconnect();
    process.exit(1);
  }
};


main();