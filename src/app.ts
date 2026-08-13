import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import appRouter from './core/app/appRouter';
import globalErrorHandler from './core/middlewares/globalErrorHandler';
import notFoundError from './core/error/notFoundError';
import logger from './core/config/logger';


const app: Application = express();


// ─── Security ───────
app.use(helmet());

app.use(
  cors({
    origin:      true,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);


// ─── Logging ─────────
app.use(morgan('combined'));


// ─── Body parsing ───────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ─── Health check ────────
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: true, message: 'Server is healthy' });
});


// ─── Static uploads ─────────
const uploadPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadPath));


// ─── API Routes ─────────
app.use('/api', appRouter);


app.use(notFoundError);
app.use(globalErrorHandler);

logger.info('Middleware stack initialized');


export { app };