import { SafeUser } from '../entities/auth/auth.interface';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }

    namespace Multer {
      type Files = {
        [fieldname: string]: Express.Multer.File[];
      };
    }
  }
}

export {};