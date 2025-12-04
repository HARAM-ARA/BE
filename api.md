# API route

---

`/std/select/pull/shuffle`

# Request

---

```c
POST /std/select/pull/shuffle
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
  "message": "선택한 팀과 크레딧이 교환되었습니다.",
  "myTeam": {
    "teamId": 1,
    "credit": 30000
  },
  "targetTeam": {
    "teamId": 3,
    "credit": 500
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

---

- 크레딧 교환을 뽑으면 선택한 팀과 크레딧을 완전히 바꾼다.