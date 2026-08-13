import { Prisma } from '../../../prisma/generated/client';
import { TErrorSources, TGenericErrorResponse } from '../interface';


const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {

  let statusCode = 400;
  let message = 'Database Error';
  let errorSources: TErrorSources = [{ path: '', message: err.message }];

  // P2002 — Unique constraint violation
  if (err.code === 'P2002') {
    const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
    errorSources = [{ path: fields, message: `${fields} already exists` }];
    message = 'Duplicate Entry';
  }

  // P2025 — Record not found (e.g. update/delete on non-existent row)
  else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record Not Found';
    errorSources = [
      {
        path: '',
        message: (err.meta?.cause as string) ?? 'The requested record does not exist',
      },
    ];
  }

  // P2003 — Foreign key constraint violation
  else if (err.code === 'P2003') {
    const field = (err.meta?.field_name as string) ?? 'field';
    errorSources = [{ path: field, message: `Related record not found for ${field}` }];
    message = 'Foreign Key Constraint Failed';
  }

  return { statusCode, message, errorSources };
};

export default handlePrismaKnownError;