import { Role, Gender } from '../../../prisma/generated/enums';


export interface IAddress {
  addressCountry?:    string | null;
  addressCityState?:  string | null;
  addressRoadArea?:   string | null;
  addressPostalCode?: string | null;
  addressTaxId?:      string | null;
}


export interface IUser extends IAddress {
  id:       string;
  name:     string;
  email:    string;
  password: string;

  username?: string | null;
  dob?:      Date   | null;
  phone?:    string | null;

  gender: Gender;
  role:   Role;

  stripeAccountId?: string | null;
  bio?:             string | null;

  profileImage?:     string | null;
  multiProfileImage: string[];

  pdfFile?: string | null;

  otp?:        string | null;
  otpExpires?: Date   | null;
  otpVerified: boolean;

  resetExpires?: Date | null;
  isVerified:    boolean;

  refreshToken?: string | null;

  hasActiveSubscription:  boolean;
  subscriptionExpireDate?: Date | null;

  blockedUsers: string[];

  language: string;

  createdAt: Date;
  updatedAt: Date;
}


// Safe user shape returned to clients (no password / tokens)
export type SafeUser = Omit<IUser, 'password' | 'refreshToken' | 'otp' | 'otpExpires' | 'resetExpires'>;