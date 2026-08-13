import { Request, Response } from 'express';

const notFoundError = (req: Request, res: Response) => {
  res
    .status(404)
    .json({ success: false, message: 'Not Found', path: req.path });
};

export default notFoundError;