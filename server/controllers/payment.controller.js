import appError from "../utils/appError.js"
import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import crypto from 'crypto'
import Payment from "../models/payment.model.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const getRazorpayApiKey = async (req,res,next)=>{
    try {
        res.status(200).json({
            success : true,
            message : 'Razorpay API Key',
            key : process.env.RAZORPAY_KEY_ID
        })
    } catch (e) {
        return next(new appError(e.message, 500));
    }
}

export const buySubscription = asyncHandler(async (req, res, next)=>{
    try {
        
        const {id} = req.user;
        const user = await User.findById(id);
        console.log(user.id);
        if(!user){
            return next(new appError('Unauthorized, please login',500));
        }

        if(user.role == 'ADMIN'){
            return next(new appError('Admin cannot buy subscription',400))
        }
        console.log(user.role)
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count : 12
        });
        console.log(subscription);
        console.log(subscription.plan_id)

        //update user model with subscription
        user.subscription.id = subscription.id
        user.subscription.status = subscription.status

        console.log(subscription.id)
        await user.save();

        res.status(200).json({
            success:  true,
            
            message : 'Subscribed successfully',
            subscription
        })


    } catch (e) {
        return next(new appError(e.message , 500));
    }
})


export const verifySubscription = asyncHandler(async (req,res,next)=>{
    try {
        const {id} = req.user;

        var {
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id
        } = req.body;

        razorpay_payment_id = "Mabq8tMNcPR6u1"
        razorpay_signature = "7d93f4293cb0aed1614220e7b26f257951b73e5ccee9873a9632781924177ccc"
        razorpay_subscription_id = "sub_MabnR3MAlN8C6n";


        const user = await User.findById(id);
        const subscriptionId = user.subscription.id;

        // console.log(subscriptionId)

        const generatedSignature = crypto
        .createHmac('sha256',process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id} | ${subscriptionId}`)
        .digest('hex')

        console.log(generatedSignature)
        console.log("*****************")
        console.log(razorpay_signature)
        if(generatedSignature !== razorpay_signature){
            return next(new appError('Payment not verified, Please try again later',400));
        }
        
        //Record payment details in Payment collection
        console.log("Reached here!!!!!!!!")
        console.log("++++++++++++++++++++++++++++++++++++++++++")
        console.log(razorpay_payment_id)
        await Payment.create({
            razorpay_payment_id : razorpay_payment_id,
            razorpay_signature : razorpay_signature,
            razorpay_subscription_id : razorpay_subscription_id
        });

        //Before this status will be 'created'


        //Update user record with subscription status

        user.subscription.status = 'active'
        await user.save();
        
        res.status(200).json({
            success : true,
            message : 'Payment verified successfully'
        })

    } catch (e) {
        return next(new appError(e.message, 500))
    }
})

export const cancelSubscription = asyncHandler(async (req,res,next)=>{
    try {
        
        const {id} = req.user;
        const user = User.findById(id);

        if(!user){
            return next(new appError('Unauthorized, please login',500));
        }

        if(user.role == 'ADMIN'){
            return next(new appError('Admin cannot cancel subscription',403))
        }


        const subscription_id = user.subscription_id;
        const subscription = await razorpay.subscriptions.cancel({
            subscription_id
        });

        user.subscription.status = subscription.status;
        await user.save();

        res.status(200).json({
            success:  true,
            message : 'Subscription cancelled'
        });
        

    } catch (e) {
        return next(new appError(e.message , 500))
    }
})

export const getAllPayments = asyncHandler(async (req,res,next)=>{
    try {
        
        const {count} = req.query;
        const subscription = await razorpay.subscriptions.all({
            count : count | 10,
        });

        res.status(200).json({
            success : true,
            message : 'All payments',
            payments : subscription
        })


    } catch (e) {
        return next(new appError(e.message , 500))
    }
})
