# Makai

One-line description.

## Local Install

```bash
brew install postgresql@17
brew services start postgresql@17
brew install temporal
createdb makai
git clone [repo url]
cd mkai
npm install
cp .env.example .env
npm run sync
```

## Local Development

```bash
npm run temporal
npm run worker
npm run dev
```

## API Endpoints

### `POST /job`

Submits a batch of user records for import and starts the workflow that processes them.

**Headers**

| Header            | Required | Description                                           |
| ----------------- | -------- | ----------------------------------------------------- |
| `Content-Type`    | yes      | `application/json`                                    |
| `Idempotency-Key` | yes      | UUID v4. Resubmitting the same key will not duplicate work. |

**Body**

| Field             | Type   | Required | Description                                      |
| ----------------- | ------ | -------- | ------------------------------------------------ |
| `email`           | string | yes      | Address notified when the job reaches a terminal state |
| `users`           | array  | yes      | At least one record                              |
| `users[].name`    | string | yes      | Trimmed; must not be empty                       |
| `users[].email`   | string | yes      | Lowercased before storage; unique across users   |
| `users[].phone`   | string \| null | yes | Trimmed; may be `null`                       |

**Example**

```bash
curl -X POST http://localhost:3000/job \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 3f8c1d2e-9b7a-4c5d-8e1f-2a3b4c5d6e7f' \
  -d '{
    "email": "you@example.com",
    "users": [
      { "name": "Avery Alvarez", "email": "avery.alvarez@example.com", "phone": "+1-531-354-7468" },
      { "name": "Blake Hayes",   "email": "blake.hayes@test.dev",      "phone": null }
    ]
  }'
```

**`201 Created`**

The `Location` header points at the status endpoint for this job.

```json
{
  "id": "a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "status": "queued",
  "createdAt": "2026-09-18T22:14:03.221Z",
  "updatedAt": "2026-09-18T22:14:03.221Z"
}
```

**Errors**

| Status | Condition                                                      |
| ------ | -------------------------------------------------------------- |
| `500`  | Unexpected server error                                        |

Individual records are **not** rejected at this stage beyond schema validation.
Rows that violate a database constraint (a duplicate email, for example) are skipped
during processing and do not fail the job.

---

### `GET /job/:id`

Returns the current state of a job. Safe to poll.

**Parameters**

| Parameter | Type      | Description                                |
| --------- | --------- | ------------------------------------------ |
| `id`      | UUID v4   | Job identifier returned by `POST /job`     |

**Example**

```bash
curl http://localhost:3000/job/a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d
```

**`200 OK`**

```json
{
  "id": "a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "status": "processing",
  "createdAt": "2026-09-18T22:14:03.221Z",
  "updatedAt": "2026-09-18T22:14:09.884Z"
}
```

**Errors**

| Status | Condition                          |
| ------ | ---------------------------------- |
| `500`  | Unexpected server error            |

---

### `DELETE /job/:id`

Requests cancellation of a running job.

Cancellation is cooperative, not immediate. The worker stops at the next record
boundary, so a `202` means the request was accepted — not that the job has already
stopped. Records imported before the cancellation are kept; there is no rollback.
Poll `GET /job/:id` until the status reads `canceled`.

**Parameters**

| Parameter | Type    | Description                            |
| --------- | ------- | -------------------------------------- |
| `id`      | UUID v4 | Job identifier returned by `POST /job` |

**Example**

```bash
curl -X DELETE http://localhost:3000/job/a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d
```

**`202 Accepted`**

**Errors**

| Status | Condition                                        |
| ------ | ------------------------------------------------ |
| `500`  | Unexpected server error                          |