import { Role, Gender } from '../../../prisma/generated/enums';
import prisma from '../../core/config/prisma';
import { createFilter, createPaginationInfo } from '../../lib/pagination';
import { cloudinaryUpload, cloudinaryDelete } from '../../lib/cloudinaryUpload';
import AppError from '../../core/error/appError';
import SAFE_USER_SELECT from '../../core/constants/userSelect';


// ─── DTO Types ────────────────────────────────────────────

interface GetUsersInput {
  page?:   string | number;
  limit?:  string | number;
  search?: string;
  date?:   string;
}


// Fields a regular user is allowed to update on their own profile.
// Sensitive fields (role, isVerified, hasActiveSubscription, password,
// refreshToken, otp*, resetExpires, stripeAccountId, blockedUsers) are
// intentionally excluded to prevent mass-assignment / privilege escalation.
interface UserSelfUpdateInput {
  name?:              string;
  username?:          string;
  bio?:               string;
  phone?:             string;
  dob?:               Date | string;
  gender?:            Gender;
  language?:          string;
  addressCountry?:    string;
  addressCityState?:  string;
  addressRoadArea?:   string;
  addressPostalCode?: string;
  addressTaxId?:      string;
}


// Fields an admin is additionally allowed to change on any user.
// Role promotion and account flags are intentionally kept here and
// absent from UserSelfUpdateInput.
interface AdminUserUpdateInput extends UserSelfUpdateInput {
  role?:                  Role;
  isVerified?:            boolean;
  hasActiveSubscription?: boolean;
  subscriptionExpireDate?: Date | string | null;
  stripeAccountId?:       string | null;
  blockedUsers?:          string[];
}


// ─── Admin — list users / admins ──────────────────────────

export const getAllUsers = async ({
  page = 1, limit = 10, search, date,
}: GetUsersInput) => {
  const _page  = Number(page);
  const _limit = Number(limit);

  const where = {
    ...createFilter(search, date),
    role: Role.USER,
  };

  const [totalUsers, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select:  SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip:    (_page - 1) * _limit,
      take:    _limit,
    }),
  ]);

  return { users, paginationInfo: createPaginationInfo(_page, _limit, totalUsers) };
};


export const getAllAdmins = async ({
  page = 1, limit = 10, search, date,
}: GetUsersInput) => {
  const _page  = Number(page);
  const _limit = Number(limit);

  const where = {
    ...createFilter(search, date),
    role: Role.ADMIN,
  };

  const [totalAdmins, admins] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select:  SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip:    (_page - 1) * _limit,
      take:    _limit,
    }),
  ]);

  return { admins, paginationInfo: createPaginationInfo(_page, _limit, totalAdmins) };
};


// ─── User profile ─────────────────────────────────────────

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: SAFE_USER_SELECT,
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};


export const updateUser = async (id: string, body: UserSelfUpdateInput) => {
  // Destructure only the explicitly whitelisted fields.
  // Any extra keys sent by the client (e.g. role, password, isVerified)
  // are simply discarded here and never reach Prisma.
  const {
    name,
    username,
    bio,
    phone,
    dob,
    gender,
    language,
    addressCountry,
    addressCityState,
    addressRoadArea,
    addressPostalCode,
    addressTaxId,
  } = body;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(name              !== undefined && { name }),
      ...(username          !== undefined && { username }),
      ...(bio               !== undefined && { bio }),
      ...(phone             !== undefined && { phone }),
      ...(dob               !== undefined && { dob: new Date(dob as string) }),
      ...(gender            !== undefined && { gender }),
      ...(language          !== undefined && { language }),
      ...(addressCountry    !== undefined && { addressCountry }),
      ...(addressCityState  !== undefined && { addressCityState }),
      ...(addressRoadArea   !== undefined && { addressRoadArea }),
      ...(addressPostalCode !== undefined && { addressPostalCode }),
      ...(addressTaxId      !== undefined && { addressTaxId }),
    },
    select: SAFE_USER_SELECT,
  });

  if (!updatedUser) throw new AppError(404, 'User not found');
  return updatedUser;
};


export const deleteUser = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
  return true;
};


// ─── Single avatar ────────────────────────────────────────

export const createAvatarProfile = async (id: string, files: Express.Multer.Files) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  const profileImage = files['profileImage']?.[0];
  if (!profileImage) throw new AppError(400, 'Profile image is required');

  const result = await cloudinaryUpload(
    profileImage.path,
    `${user.id}-${Date.now()}`,
    'user-profile',
  );

  return prisma.user.update({
    where:  { id },
    data:   { profileImage: result.url },
    select: SAFE_USER_SELECT,
  });
};


export const updateAvatarProfile = async (id: string, files: Express.Multer.Files) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  const profileImage = files['profileImage']?.[0];
  if (!profileImage) throw new AppError(400, 'Profile image is required');

  if (user.profileImage) await cloudinaryDelete(user.profileImage);

  const result = await cloudinaryUpload(
    profileImage.path,
    `${user.id}-${Date.now()}`,
    'user-profile',
  );

  return prisma.user.update({
    where:  { id },
    data:   { profileImage: result.url },
    select: SAFE_USER_SELECT,
  });
};


export const deleteAvatarProfile = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');
  if (!user.profileImage) throw new AppError(400, 'No profile image to delete');

  await cloudinaryDelete(user.profileImage);

  return prisma.user.update({
    where:  { id },
    data:   { profileImage: null },
    select: SAFE_USER_SELECT,
  });
};


// ─── Multiple avatars ─────────────────────────────────────

export const createMultipleAvatar = async (id: string, files: Express.Multer.Files) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  const images = files['multiProfileImage'];
  if (!images?.length) throw new AppError(400, 'Profile images are required');

  const imageUrls = await Promise.all(
    images.map((image, index) =>
      cloudinaryUpload(
        image.path,
        `${user.id}-${Date.now()}-${index}`,
        'user-profile',
      ).then((r) => r.url),
    ),
  );

  return prisma.user.update({
    where:  { id },
    data:   { multiProfileImage: imageUrls },
    select: SAFE_USER_SELECT,
  });
};


export const updateMultipleAvatar = async (id: string, files: Express.Multer.Files) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  const images = files['multiProfileImage'];
  if (!images?.length) throw new AppError(400, 'Profile images are required');

  if (user.multiProfileImage?.length) {
    await Promise.all(user.multiProfileImage.map((url) => cloudinaryDelete(url)));
  }

  const imageUrls = await Promise.all(
    images.map((image, index) =>
      cloudinaryUpload(
        image.path,
        `${user.id}-${Date.now()}-${index}`,
        'user-profile',
      ).then((r) => r.url),
    ),
  );

  return prisma.user.update({
    where:  { id },
    data:   { multiProfileImage: imageUrls },
    select: SAFE_USER_SELECT,
  });
};


export const deleteMultipleAvatar = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');
  if (!user.multiProfileImage?.length) throw new AppError(400, 'No profile images to delete');

  await Promise.all(user.multiProfileImage.map((url) => cloudinaryDelete(url)));

  return prisma.user.update({
    where:  { id },
    data:   { multiProfileImage: [] },
    select: SAFE_USER_SELECT,
  });
};


// ─── PDF ──────────────────────────────────────────────────

export const createUserPDF = async (id: string, files: Express.Multer.Files) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  const pdfFile = files['userPDF']?.[0];
  if (!pdfFile) throw new AppError(400, 'PDF file is required');

  const result = await cloudinaryUpload(
    pdfFile.path,
    `${user.id}-${Date.now()}`,
    'user-pdf',
  );

  return prisma.user.update({
    where:  { id },
    data:   { pdfFile: result.url },
    select: SAFE_USER_SELECT,
  });
};


export const updateUserPDF = async (id: string, files: Express.Multer.Files) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  const pdfFile = files['userPDF']?.[0];
  if (!pdfFile) throw new AppError(400, 'PDF file is required');

  if (user.pdfFile) await cloudinaryDelete(user.pdfFile);

  const result = await cloudinaryUpload(
    pdfFile.path,
    `${user.id}-${Date.now()}`,
    'user-pdf',
  );

  return prisma.user.update({
    where:  { id },
    data:   { pdfFile: result.url },
    select: SAFE_USER_SELECT,
  });
};


export const deleteUserPDF = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');
  if (!user.pdfFile) throw new AppError(400, 'No PDF file to delete');

  await cloudinaryDelete(user.pdfFile);

  return prisma.user.update({
    where:  { id },
    data:   { pdfFile: null },
    select: SAFE_USER_SELECT,
  });
};


// ─── Admin — individual user CRUD ─────────────────────────

export const adminGetUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: SAFE_USER_SELECT,
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};


export const adminUpdateUser = async (
  id: string,
  body: AdminUserUpdateInput,
) => {
  // Admins get a wider field set than regular users, but the whitelist
  // still prevents arbitrary column writes (e.g. password, refreshToken, otp*).
  const {
    name,
    username,
    bio,
    phone,
    dob,
    gender,
    language,
    addressCountry,
    addressCityState,
    addressRoadArea,
    addressPostalCode,
    addressTaxId,
    role,
    isVerified,
    hasActiveSubscription,
    subscriptionExpireDate,
    stripeAccountId,
    blockedUsers,
  } = body;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(name                   !== undefined && { name }),
      ...(username               !== undefined && { username }),
      ...(bio                    !== undefined && { bio }),
      ...(phone                  !== undefined && { phone }),
      ...(dob                    !== undefined && { dob: new Date(dob as string) }),
      ...(gender                 !== undefined && { gender }),
      ...(language               !== undefined && { language }),
      ...(addressCountry         !== undefined && { addressCountry }),
      ...(addressCityState       !== undefined && { addressCityState }),
      ...(addressRoadArea        !== undefined && { addressRoadArea }),
      ...(addressPostalCode      !== undefined && { addressPostalCode }),
      ...(addressTaxId           !== undefined && { addressTaxId }),
      ...(role                   !== undefined && { role }),
      ...(isVerified             !== undefined && { isVerified }),
      ...(hasActiveSubscription  !== undefined && { hasActiveSubscription }),
      ...(subscriptionExpireDate !== undefined && {
        subscriptionExpireDate: subscriptionExpireDate
          ? new Date(subscriptionExpireDate as string)
          : null,
      }),
      ...(stripeAccountId        !== undefined && { stripeAccountId }),
      ...(blockedUsers           !== undefined && { blockedUsers }),
    },
    select: SAFE_USER_SELECT,
  });

  if (!updatedUser) throw new AppError(404, 'User not found');
  return updatedUser;
};


export const adminDeleteUser = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
  return true;
};