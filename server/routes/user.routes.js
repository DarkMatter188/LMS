// const express = require('express');
import express from 'express';
const router = express.Router();
// const {isLoggedIn} = require('../middlewares/auth.middleware')

import { isLoggedIn } from '../middlewares/auth.middleware.js';

// const  {
//     register,
//     login,
//     logout,
//     getProfile
// } = require('./../controllers/user.controller.js');

import {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
} from './../controllers/user.controller.js'
import upload from '../middlewares/multer.middleware.js';



router.post('/register',upload.single('avatar') , register);
router.post('/login',login);
router.get('/logout',logout);
router.get('/me', isLoggedIn ,getProfile);
//Making to reset password via email trigger
router.post('/reset',forgotPassword);
router.post('/reset/:resetToken',resetPassword);
router.post('/change-password',isLoggedIn, changePassword)
router.put('/update', isLoggedIn , upload.single('avatar'),updateUser)



// module.exports = router;
export default router;