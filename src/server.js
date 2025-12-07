import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { initDatabase } from './models/db.js';
import { boardModel } from './models/boardModel.js';
import { wordModel } from './models/wordModel.js';
import { typingGameModel } from './models/typingGameModel.js';
import { typingSubmissionModel } from './models/typingSubmissionModel.js';
import { typingService } from './services/typingService.js';
import { cspMiddleware } from './middlewares/csp.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import tchRoutes from './routes/tch.js';
import haramRoutes from './routes/haram.js';
import stdRoutes from './routes/std.js';

const app = express();

// CORS middleware for development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cspMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/haram/auth', authRoutes);
app.use('/tch', tchRoutes);
app.use('/haram', haramRoutes);
app.use('/std', stdRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

initDatabase();
boardModel.initBoard();

// 타자게임 초기화
wordModel.initWords();
typingGameModel.initGames();
typingSubmissionModel.initSubmissions();
typingService.initialize();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Swagger docs available at http://localhost:${config.port}/api-docs`);
});

export default app;
