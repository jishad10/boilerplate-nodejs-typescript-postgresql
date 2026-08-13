export interface PaginationInfo {
  currentPage: number;
  totalPages:  number;
  totalData:   number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}


// Prisma `where` clause builder
// — search: case-insensitive name match using Prisma's `contains + mode`
// — date:   filters by a single calendar day using gte / lt on createdAt

export const createFilter = (
  search?: string,
  date?:   string | Date,
): Record<string, any> => {

  const where: Record<string, any> = {};

  if (search) {
    where.name = {
      contains: search,
      mode:     'insensitive',   // Prisma's case-insensitive mode (PostgreSQL: uses ilike)
    };
  }

  if (date) {
    const _date      = new Date(date);
    const startOfDay = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate());
    const endOfDay   = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate() + 1);

    where.createdAt = {
      gte: startOfDay,
      lt:  endOfDay,
    };
  }

  return where;
};


export const createPaginationInfo = (
  page:      number,
  limit:     number,
  totalData: number,
): PaginationInfo => ({
  currentPage: page,
  totalPages:  Math.ceil(totalData / limit),
  totalData,
  hasNextPage: page * limit < totalData,
  hasPrevPage: page > 1,
});