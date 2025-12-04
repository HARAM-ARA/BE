# 기본 원칙
- SOLID원칙을 항상 준수
- OOP를 항상 준수
- 객체지향 생활체조원칙을 항상 준수
- DRY, KISS원칙을 항상 준수
- YAGNI 원칙을 항상 준수

---

# 프로젝트 개요

## 프로젝트명: HARAM (하람 게임 플랫폼)
- **유형**: 교육용 게임 플랫폼 백엔드
- **목적**: 학생 팀 관리 및 크레딧 기반 뽑기 게임 시스템
- **아키텍처**: MVC 패턴 (Model-Service-Controller 계층 구조)

## 기술 스택
- **Runtime**: Node.js (ES6 Module)
- **Framework**: Express.js 4.18.2
- **Database**: SQLite 3 (better-sqlite3)
- **Authentication**: JWT + Google OAuth 2.0
- **API 문서화**: Swagger/OpenAPI 3.0

---

# 아키텍처 구조

## 계층별 책임

### 1. Routes (라우트 계층)
- HTTP 요청 매핑 및 미들웨어 연결
- 역할: URL 경로와 컨트롤러 함수 연결

### 2. Controllers (컨트롤러 계층)
- 요청 검증 및 응답 포맷팅
- 역할: HTTP 요청/응답 처리, 서비스 계층 호출

### 3. Services (서비스 계층)
- 비즈니스 로직 구현
- 역할: 핵심 로직, 트랜잭션 관리, 외부 API 통합

### 4. Models (모델 계층)
- 데이터베이스 접근 및 쿼리 실행
- 역할: CRUD 작업, SQL 쿼리 관리

### 5. Middlewares (미들웨어 계층)
- 인증, 권한, 에러 처리, 보안
- 역할: 요청 전처리 및 후처리

### 6. Utils (유틸리티 계층)
- 재사용 가능한 헬퍼 함수
- 역할: 검증, 파싱, 외부 API 래퍼

---

# 핵심 도메인 로직

## 1. 인증 및 권한
- **인증 방식**: Google OAuth 2.0 → JWT 발급
- **역할**: `student` (학생), `teacher` (교사)
- **권한 검증**: 미들웨어 기반 RBAC (Role-Based Access Control)
- **토큰 저장**: HTTP 헤더 또는 쿠키

## 2. 팀 관리
- **팀 구조**: 반 번호 + 팀 번호로 식별
- **팀 크레딧**: 초기 3000, 게임에 사용
- **학생 배정**: 1명의 학생은 1개 팀에만 소속
- **대량 등록**: Google Sheets API를 통한 일괄 등록

## 3. 게임 시스템 (뽑기)
- **카드**: 1~100번 카드
- **비용**: 카드 뽑기당 500 크레딧 (최소 1000 필요)
- **결과**: 12가지 확률 기반 결과
  - steal (1.5%): 다른 팀 크레딧 탈취
  - double (1.4%): 현재 크레딧 2배
  - swap (1.3%): 다른 팀과 크레딧 교환
  - reset (1.13%): 모든 팀 크레딧 초기화
  - anger (0.00001%): 특수 효과
  - boom (50%): 실패
  - credit_X (나머지): 크레딧 획득
- **보드 리셋**: 100개 모두 뽑히면 자동 초기화

## 4. 상점 관리
- **교사 전용**: 교사가 아이템 등록
- **구성**: 이름, 가격, 수량, 이미지
- **권한**: 소유 교사만 수정/삭제 가능

---

# 데이터베이스 설계

## 주요 테이블

### users (사용자)
- 구글 이메일 기반 사용자
- `role`: student | teacher
- `user_number`: 학번 (학생만)

### teams (팀)
- `team_number` + `class_number`: 복합 고유키
- `team_credit`: 게임 크레딧
- 초기 크레딧: 3000

### student_teams (학생-팀 매핑)
- 1:1 관계 (학생 1명 = 1팀)
- 외래키 제약으로 무결성 보장

### stores (상점)
- 교사가 등록한 아이템
- `teacher_id`: 소유 교사 FK

### pull_board (뽑기 보드)
- 1~100번 카드 상태 추적
- `is_pulled`: 뽑힘 여부
- `pulled_by_team_id`: 뽑은 팀

## 데이터 무결성
- **외래키 제약**: 참조 무결성 보장
- **트랜잭션**: 원자성 보장 (all-or-nothing)
- **트리거**: `updated_at` 자동 갱신
- **CHECK 제약**: 가격, 수량 음수 방지

---

# API 설계 원칙

## RESTful 규칙
- GET: 조회
- POST: 생성, 비멱등 작업
- PUT: 전체 수정
- DELETE: 삭제

## 응답 형식
```json
{
  "data": { ... },        // 성공 시
  "error": "message"      // 실패 시
}
```

## 에러 처리
- **AppError 클래스**: 커스텀 에러
- **중앙 에러 핸들러**: 일관된 에러 응답
- **HTTP 상태 코드**: 적절한 코드 사용

---

# 보안 원칙

## 인증/인가
- JWT 토큰: 7일 만료
- Google OAuth: BSSM 이메일 도메인만 허용
- 역할 기반 권한 검증: 미들웨어에서 처리

## 입력 검증
- 모든 사용자 입력 검증
- 가격/수량: 음수 방지
- 문자열 길이: 최대값 제한
- 이메일 형식: 정규식 검증

## 보안 헤더
- Content Security Policy
- X-Frame-Options: DENY
- X-XSS-Protection
- X-Content-Type-Options

## 데이터베이스 보안
- SQL Injection 방지: prepared statements
- 트랜잭션: 일관성 보장
- 외래키: 참조 무결성

---

# 코드 작성 가이드

## 파일 구조 규칙
```
새 기능 추가 시:
1. Model 작성 (DB 접근)
2. Service 작성 (비즈니스 로직)
3. Controller 작성 (요청 처리)
4. Route 연결 (URL 매핑)
5. Middleware 추가 (필요 시)
```

## 트랜잭션 사용
- 여러 테이블 수정 시 필수
- 에러 발생 시 자동 롤백
```javascript
const transaction = db.transaction(() => {
  // 여러 DB 작업
});
transaction();
```

## 에러 처리
```javascript
// AppError 사용
throw new AppError('메시지', 400, { detail: '...' });

// 서비스 계층에서 던지기, 컨트롤러에서 catch
```

## 비동기 처리
- 모든 컨트롤러는 async/await 사용
- 에러는 next(error)로 전달

---

# 외부 연동

## Google OAuth 2.0
- 로그인 전용 (BSSM 이메일만)
- Access Token → 사용자 정보 → JWT 생성

## Google Sheets API
- 팀 정보 대량 등록
- 필수 컬럼: TEAM_NUMBER, CLASS_NUMBER, NAME, EMAIL

---

# 개발 규칙

## 코드 스타일
- ESLint + Prettier 사용
- ES6 모듈 시스템
- async/await 사용 (Promise 체이닝 지양)

## 테스트
- Jest 사용
- 단위 테스트 작성

## Git 규칙
- feat: 새 기능
- fix: 버그 수정
- chore: 기타 작업
- 브랜치: feat/#이슈번호/기능명

---

# 현재 개발 중인 기능
- **브랜치**: feat/#17/크레딧-섞기
- **목적**: 크레딧 섞기 기능 추가