# API route

---

`/std/select/pull/steal`

# Request

---

```c
POST /std/select/pull/steal
Content-Type:application/json
Authorization: Bearer <ACCESS_TOKEN>

{
	"targetTeamId": 3
}
```

# Response

---

```json
{
  "message": "선택한 팀의 크레딧을 뺏어왔습니다.",
  "myTeam": {
    "teamId": 1,
    "credit": 110000
  },
  "targetTeam": {
    "teamId": 3,
    "credit": 1000
  }
}
```

# Error

---

| Status Code | error | message | Detail |
| --- | --- | --- | --- |
| 404 | NON_EXIST_TEAM | 존재하지 않는 팀입니다 | 없는 팀 id를 지정했을 시 |
| 400 | INCORRECT_TEAM | ID가 잘못되었습니다 | 잘못된 id 입력 |

# 설명