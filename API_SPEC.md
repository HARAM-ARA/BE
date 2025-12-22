# HARAM API Documentation

## Authentication (`/haram/auth`)

### POST `/haram/auth/login`
- **Summary**: Google OAuth Login
- **Body**: `{ "code": "string" }`
- **Response**:
    - `200 OK`: `{ "success": true, "data": { "user": { ... }, "token": "string" } }`
    - `400 Bad Request`

### GET `/haram/auth/profile`
- **Summary**: Get User Profile
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
    - `200 OK`: `{ "success": true, "data": { "user": { ... } } }`
    - `401 Unauthorized`

### GET `/haram/auth/logout`
- **Summary**: Logout
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
    - `200 OK`: `{ "success": true, "message": "string" }`

---

## Teacher (`/tch`) - *Teacher Role Required*

### Account
- **GET `/tch/account`**: Get all team credits.
- **POST `/tch/account`**: Add credit to a team.
    - Body: `{ "teamId": integer, "addCredit": number }`

### Store
- **GET `/tch/store`**: Get all stores.
- **POST `/tch/store`**: Create a store.
    - Body: `{ "name": "string", "price": number, "quantity": integer, "imageUrl": "string" }`
- **GET `/tch/store/:id`**: Get a specific store.
- **PUT `/tch/store/:id`**: Update a store.
- **DELETE `/tch/store/:id`**: Delete a store.
- **POST `/tch/store/upload`**: Upload store image.

### Student & Team
- **GET `/tch/student`**: Get all students.
- **POST `/tch/append`**: Bulk register students/teams via Google Sheet.
    - Body: `{ "sheetUrl": "string" }`
- **POST `/tch/student/assign`**: Assign a single student to a team.
    - Body: `{ "userNumber": "string", "name": "string", "teamId": integer }`
- **GET `/tch/team/:id`**: Get team info.
- **POST `/tch/team`**: Create a team.
    - Body: `{ "teamName": "string", "students": [integer] }`

---

## Haram (`/haram`)

### Team
- **GET `/haram/team`**: Get all teams list.

### Store (Public)
- **GET `/haram/store`**: Get all store items.
- **GET `/haram/store/:type`**: Get store items by type (1=Coupon, 2=Snack).

---

## Student (`/std`) - *Student Role Required*

### Account
- **GET `/std/account`**: Get my account info (credit, etc.).

### Select (Card Game)
- **POST `/std/select/pull`**: Pull a card.
    - Body: `{ "card": integer }`
- **POST `/std/select/pull/shuffle`**: Swap credit with another team.
    - Body: `{ "targetTeamId": integer }`
- **POST `/std/select/pull/steal`**: Steal credit from another team.
    - Body: `{ "targetTeamId": integer }`
- **POST `/std/select/pull/anger`**: Reset anger (or specific action).
    - Body: `{ "targetTeamId": integer }`

### Typing Game
- **GET `/std/typing/game`**: Get current typing game.
- **POST `/std/typing/input`**: Submit typing result.
    - Body: `{ "input": "string", "gameId": integer }`
- **GET `/std/typing/time`**: Get server time.
- **GET `/std/typing/rank`**: Get current rank.

### Store
- **POST `/std/store`**: Purchase item.
    - Body: `{ "itemId": integer, "quantity": integer }`

### Enforce (Upgrade System)
- **GET `/std/enforce/data`**: Get enforcement data.
- **POST `/std/enforce`**: Attempt enforcement.
- **DELETE `/std/enforce`**: Sell account (reset).
- **POST `/std/enforce/buy`**: Buy tier.
    - Body: `{ "tier": number }`
- **POST `/std/enforce/credit`**: Convert enforcement points to credit.
