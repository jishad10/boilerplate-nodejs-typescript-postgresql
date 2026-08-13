import { Response } from "express";

export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
}

export const generateResponse = <T>(
  res: Response,
  statusCode: number,
  status: boolean,
  message: string,
  data?: T
) => {
  const response: ApiResponse<T> = {
    status,
    message,
    ...(data !== undefined && { data }),
  };

  return res.status(statusCode).json(response);
};