import { Router } from "express";
import authRoutes from "../../entities/auth/auth.routes";
import userRoutes from "../../entities/user/user.routes";


const router: Router = Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/users", userRoutes);


export default router;