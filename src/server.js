import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { initDatabase } from './models/db.js';
import { cspMiddleware } from './middlewares/csp.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import tchRoutes from './routes/tch.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cspMiddleware);

app.use('/haram/auth', authRoutes);
app.use('/tch', tchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

initDatabase();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
