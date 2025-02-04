import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
// import courseRoutes from './routes/course.routes.js';
// import paymentRoutes from './routes/payment.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import courseRoutes from './routes/course.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import morgan from 'morgan';

const app = express();

app.use(express.json());

app.use(
  cors({origin: ['http://192.168.1.4:3000', 'http://localhost:5010'],
      credentials : true                
})
);

app.use(morgan('dev'));

app.use(cookieParser());

app.use('/ping', (req, res) => {
    res.send('Pong');
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments',paymentRoutes)
// app.use('/api/v1/payments', paymentRoutes);

app.all('*', (req, res) => {
    res.status(404).send('OOPS!! 404 page not found');
});

app.use(errorMiddleware);

export default app;