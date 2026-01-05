import express from "express";
import { deleteUser, getAllUser, getUserById, login, profile, Register, updateUser } from "../Controller/UserController.js";
// import { Authendication } from "../Middleware/Auth.js";
const router = express.Router();

router.post("/register",Register)
// router.post("/login",login)
// router.get("/profile",Authendication,profile)
// router.put("/v2/update",  updateUser)
// router.delete("/v2/deleteUser",  deleteUser)
// router.get("/get",  getAllUser)
// router.get("/v2/getbyid/:id", getUserById)


export default router   