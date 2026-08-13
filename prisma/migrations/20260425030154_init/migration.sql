-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT,
    "dob" TIMESTAMP(3),
    "phone" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'male',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "stripeAccountId" TEXT,
    "bio" TEXT,
    "addressCountry" TEXT,
    "addressCityState" TEXT,
    "addressRoadArea" TEXT,
    "addressPostalCode" TEXT,
    "addressTaxId" TEXT,
    "profileImage" TEXT,
    "multiProfileImage" TEXT[],
    "pdfFile" TEXT,
    "otp" TEXT,
    "otpExpires" TIMESTAMP(3),
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetExpires" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "refreshToken" TEXT,
    "hasActiveSubscription" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionExpireDate" TIMESTAMP(3),
    "blockedUsers" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
