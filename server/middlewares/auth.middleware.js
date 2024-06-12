// const { default: appError } = require("../utils/appError");
import appError from '../utils/appError.js'
import jwt from 'jsonwebtoken';

const isLoggedIn = function(req,res,next){
    
    // const {token} = req.cookies;
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjM3ZjgxOThjMjNhZjcyMDJkZTdkZSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiYXBvb3J2cmFuamFuMzQzQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvbiI6eyJpZCI6InN1Yl9NYWJuUjNNQWxOOEM2biIsInN0YXR1cyI6ImFjdGl2ZSJ9LCJpYXQiOjE2OTYwMTY4MTgsImV4cCI6MTY5NjYyMTYxOH0.674nKWPIpx4YdxiujDNzzPn2dMurVYfpi3ewTJgSiXA'
    // console.log(res);
    // console.log(token);
    if(!token){
        return next(new appError('Unauthenticated! Please login No token found',401));
    }

    const tokenDetails = jwt.verify(token, process.env.JWT_SECRET);
    if(!tokenDetails){
        return next(new appError('Unauthenticated! Please login',401));
    }

    req.user = tokenDetails;
    console.log(req.user)
    next();
}

const authorizedRoles = (...roles) => (req,res,next) =>{
    const currentRole = req.user.role;
    if(!roles.includes(currentRole)){
        return next(new appError('You donot have permission to access this route',403))
    }

    next();
}

const authorizedSubscriber = async (req,res,next)=>{
    const subscriptionStatus = req.user.subscription.status;
    const currentRole = req.user.role;
    if(currentRole !== 'ADMIN' && subscriptionStatus !== 'active'){
        return next(new appError('Please subscribe to access this route',403));
    }

    next();
}

export {
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}