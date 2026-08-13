/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
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

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
