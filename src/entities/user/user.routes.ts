import express, { Router } from 'express';
import { multerUpload } from '../../core/middlewares/multer';
import {
  getAllUsersController,
  getAllAdminsController,
  createAvatarController,
  updateAvatarProfileController,
  deleteAvatarController,
  createMultipleAvatarController,
  updateMultipleAvatarController,
  deleteMultipleAvatarController,
  createUserPDFController,
  updateUserPDFController,
  deleteUserPDFController,
  getUserProfileController,
  updateUserProfileController,
  deleteOwnAccountController,
  adminGetUserByIdController,
  adminUpdateUserController,
  adminDeleteUserController,
} from './user.controller';

import {
  adminMiddleware,
  verifyToken,
} from '../../core/middlewares/authMiddleware';


const router: Router = express.Router();


// ─── Admin dashboard ──────────────────────────────────────
router.get('/all-users',  verifyToken, adminMiddleware, getAllUsersController);
router.get('/all-admins', verifyToken, adminMiddleware, getAllAdminsController);


// ─── User profile ─────────────────────────────────────────
router.get   ('/me', verifyToken, getUserProfileController);
router.put   ('/me', verifyToken, updateUserProfileController);
router.delete('/me', verifyToken, deleteOwnAccountController);


// ─── Single avatar ────────────────────────────────────────
router.post  ('/upload-avatar', verifyToken, multerUpload([{ name: 'profileImage', maxCount: 1 }]), createAvatarController);
router.put   ('/upload-avatar', verifyToken, multerUpload([{ name: 'profileImage', maxCount: 1 }]), updateAvatarProfileController);
router.delete('/upload-avatar', verifyToken, deleteAvatarController);


// ─── Multiple avatars ─────────────────────────────────────
router.post  ('/upload-multiple-avatar', verifyToken, multerUpload([{ name: 'multiProfileImage', maxCount: 5 }]), createMultipleAvatarController);
router.put   ('/upload-multiple-avatar', verifyToken, multerUpload([{ name: 'multiProfileImage', maxCount: 5 }]), updateMultipleAvatarController);
router.delete('/upload-multiple-avatar', verifyToken, deleteMultipleAvatarController);


// ─── PDF / file upload ────────────────────────────────────
router.post  ('/upload-file', verifyToken, multerUpload([{ name: 'userPDF', maxCount: 1 }]), createUserPDFController);
router.put   ('/upload-file', verifyToken, multerUpload([{ name: 'userPDF', maxCount: 1 }]), updateUserPDFController);
router.delete('/upload-file', verifyToken, deleteUserPDFController);


// ─── Admin — individual user CRUD (keep below named routes) ──
router.get   ('/:id', verifyToken, adminMiddleware, adminGetUserByIdController);
router.put   ('/:id', verifyToken, adminMiddleware, adminUpdateUserController);
router.delete('/:id', verifyToken, adminMiddleware, adminDeleteUserController);


export default router;