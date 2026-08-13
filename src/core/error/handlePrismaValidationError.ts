import { Prisma } from '../../../prisma/generated/client';
import { TErrorSources, TGenericErrorResponse } from '../interface';


const handlePrismaValidationError = (
  err: Prisma.PrismaClientValidationError,
): TGenericErrorResponse => {

  const errorSources: TErrorSources = [
    {
      path: '',
      message: err.message.split('\n').filter(Boolean).at(-1)?.trim() ?? err.message,
    },
  ];

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorSources,
  };
};

export default handlePrismaValidationError;