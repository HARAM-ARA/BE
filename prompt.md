# 기본 원칙
- SOLID원칙을 항상 준수
- OOP를 항상 준수
- 객체지향 생활체조원칙을 항상 준수
- DRY, KISS원칙을 항상 준수
- YAGNI 원칙을 항상 준수

# 프로젝트 분석

## 1. 프로젝트 개요
이 프로젝트는 Node.js와 Express로 구축된 "HARAM"이라는 백엔드 서버입니다. 인증, 팀/매장 관리, 그리고 "TCH" 및 "Haram" 기능과 관련된 특정 비즈니스 로직을 위한 API를 제공합니다. 데이터 저장소로 SQLite를 사용하며 API 문서를 위해 Swagger를 포함하고 있습니다.

## 2. 기술 스택
- **런타임**: Node.js
- **프레임워크**: Express.js
- **데이터베이스**: SQLite (`better-sqlite3` 사용)
- **인증**: JWT (JSON Web Tokens)
- **문서화**: Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)
- **유틸리티**:
  - `dotenv`: 환경 변수 관리
  - `cookie-parser`: 쿠키 파싱
  - `multer`: 파일 업로드
  - `googleapis`: Google API 통합
  - `xlsx`: 엑셀 파일 처리
  - `image-size`: 이미지 크기 계산

## 3. 프로젝트 구조
이 프로젝트는 표준 MVC (Model-View-Controller) 아키텍처를 따릅니다:

- **`src/server.js`**: 애플리케이션 진입점. 미들웨어, 라우트, 데이터베이스 연결을 설정하고 서버를 시작합니다.
- **`src/config/`**: 설정 파일 (환경 변수, Swagger 설정).
- **`src/models/`**: 데이터베이스 상호작용 계층.
  - `db.js`: 데이터베이스 초기화 및 연결.
  - `userModel.js`: 사용자 데이터 작업.
  - `teamModel.js`: 팀 데이터 작업.
  - `storeModel.js`: 매장 데이터 작업.
- **`src/routes/`**: API 라우트 정의.
  - `auth.js`: 인증 엔드포인트 (`/haram/auth`).
  - `tch.js`: TCH 기능 엔드포인트 (`/tch`).
  - `haram.js`: Haram 기능 엔드포인트 (`/haram`).
- **`src/controllers/`**: 요청 핸들러 (라우트 로직).
- **`src/services/`**: 비즈니스 로직 계층 (컨트롤러에서 호출).
- **`src/middlewares/`**: 커스텀 미들웨어.
  - `csp.js`: 콘텐츠 보안 정책 (CSP).
  - `errorHandler.js`: 전역 에러 처리.
- **`src/utils/`**: 헬퍼 함수.

## 4. 주요 기능 및 API 엔드포인트
- **인증**:
  - 기본 URL: `/haram/auth`
  - 로그인, 회원가입, 토큰 관리를 처리하는 것으로 보입니다.
- **TCH 모듈**:
  - 기본 URL: `/tch`
  - `tch.js`의 파일 크기를 볼 때 주요 컴포넌트로 보입니다.
- **Haram 모듈**:
  - 기본 URL: `/haram`
  - "Haram" 도메인에 특화된 핵심 비즈니스 로직일 가능성이 높습니다.
- **API 문서**:
  - `/api-docs`에서 Swagger UI를 통해 확인 가능합니다.

## 5. 데이터베이스 스키마
데이터베이스는 SQLite (`database.db`)입니다. 모델에서 식별된 주요 엔티티:
- **Users**: `userModel.js`에서 관리.
- **Teams**: `teamModel.js`에서 관리.
- **Stores**: `storeModel.js`에서 관리.

## 6. 개발 및 배포
- **스크립트**:
  - `start`: 서버 실행 (`node src/server.js`).
  - `dev`: 감시 모드로 실행 (`node --watch src/server.js`).
  - `lint` / `format`: 코드 품질 도구 (ESLint, Prettier).
  - `test`: Jest를 사용한 테스트 실행.
