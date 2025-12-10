import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { initDatabase } from './models/db.js';
import { boardModel } from './models/boardModel.js';
import { wordModel } from './models/wordModel.js';
import { typingGameModel } from './models/typingGameModel.js';
import { typingSubmissionModel } from './models/typingSubmissionModel.js';
import { purchaseModel } from './models/purchaseModel.js';
import { enforceModel } from './models/enforceModel.js';
import { typingService } from './services/typingService.js';
import { cspMiddleware } from './middlewares/csp.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import tchRoutes from './routes/tch.js';
import haramRoutes from './routes/haram.js';
import stdRoutes from './routes/std.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware (allow credentials for frontend)
const corsOptions = {
  origin: config.clientOrigin || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cspMiddleware);

// 정적 파일 서빙 (이미지 업로드)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// 구매 기록 초기화
purchaseModel.initPurchases();

// 강화 시스템 초기화
enforceModel.initEnforce();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Swagger docs available at http://localhost:${config.port}/api-docs`);
});

export default app;
