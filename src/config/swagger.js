import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HARAM API',
      version: '1.0.0',
      description: 'HARAM 백엔드 API 문서',
      contact: {
        name: 'HARAM Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 입력하세요',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '에러 메시지',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '사용자 ID',
            },
            email: {
              type: 'string',
              description: '이메일',
            },
            name: {
              type: 'string',
              description: '이름',
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher'],
              description: '역할',
            },
          },
        },
        Store: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '상점 ID',
            },
            name: {
              type: 'string',
              description: '상점 이름',
            },
            price: {
              type: 'number',
              description: '가격',
            },
            quantity: {
              type: 'integer',
              description: '수량',
            },
            image_url: {
              type: 'string',
              nullable: true,
              description: '이미지 URL',
            },
            teacher_id: {
              type: 'integer',
              description: '등록한 교사 ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성 시간',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정 시간',
            },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
