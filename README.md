# Chirpy

Chirpy is a small make believe social network API built with TypeScript, Express, PostgreSQL, and Drizzle ORM. It supports user accounts, short posts ("chirps"), JWT access tokens, refresh tokens, and a Polka webhook for Chirpy Red upgrade.

## Requirements

- Node.js with npm
- PostgreSQL

## Run locally

1. Install dependencies

```sh 
npm install
```

2. Create a `.env` file in the project root:

```dotenv
DB_URL=postgres://USER:PASSWORD@localhost:5432/Chirpy
SECRET_JWT=replace-with-a-long-random-secret
POLKA_KEY=replace-with-your-polka-api-key
PLATFORM=dev
```

    `DB_URL` points to PostgreSQL. The application applies the migration in `drizzle/` when it starts. `SECRET_JWT` signs access tokens. `POLKA_KEY` authenticates Polka webhooks. Set `PLATFORM=dev` to enable the database reset endpoint.

3. Start the development server:
```sh 
npm run dev
```

    The API listens on [http://localhost:8080](http://localhost:8080)

Other useful commands:

```sh 
npm start           # Start the server
npm run typecheck   # Check TypeScript types 
npm test            # Run tests 
npm run generate    # Generate Drizzle migrations from the schema
npm run migrate     # Apply migrations 
```

## API

All API routes use the `/api` prefix and accept JSON request bodies where applicable. Examples below assume the server is running at `http://localhost:8080`.

### Health

#### `GET /api/healthz`

Check that the server is responding.

**200 OK** returns plain text:

```text
OK
```

### chirps

A chirp body may contain up to 140 characters. The words `kerfuffle`, `sharbert`, and `fornax` are replaced with `****` before a chirp is saved.

#### `POST /api/chirps`

Create a chirp. Requires a valid access token.

Headers:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

Request:

```json
{
    "body": "Hello from Chirpy!"
}
```

**201 Created** returns the created chirp:

```json
{
    "id": "chirp-uuid",
    "createdAt": "2026-01-01T12:00:00.000z",
    "updatedAt": "2026-01-01T12:00:00.000z",
    "body": "Hello from Chirpy!",
    "userId": "user-uuid"
}
```

**400 Bad Request** is returned for a missing/non-string body or a body over 140 characters. **401 Unauthorized** is returned for a missing or invalid access token.

#### `GET /api/chirps`

List chirps, oldest first by default. Optional query parameters:

| Parameters | Description |
| ---------- | ----------- |
| `authorId` | Return only chirps created by this user ID. |
| `sort`     | Set to `desc` for newest first. Any other value uses oldest first. |

Example:

```http
GET /api/chirps?authorId=user-uuid&sort=desc
```

**200 OK** returns an array of chirps:

```json
[   
    {
        "id": "chirp-uuid",
        "createdAt": "2026-01-01T12:00:00.000z",
        "updatedAt": "2026-01-01T12:00:00.000z",
        "body": "Hello from Chirpy!",
        "userId": "user-uuid"
    }
]
```

#### `GET /api/chirps/:chirpId`

Fetch one chirp by ID.

**200 OK** returns the chirp object. **404 Not Found** returns an error if the chirp does not exist.

#### `DELETE /api/chirps/:chirpId`

Delete a chirp you own. Required a valid access token.

Headers:

```http
Authorization: Bearer <access-token>
```

**204 No Content** indicates success. **401 Unauthorized** indicates a missing or invalid token. **403 Forbidden** indicates the chirp belongs to another user. **404 Not Found** indicates the chirp does not exist.

### Users and authentication


#### `POST /api/users`

Registers a user.

Request:

```json
{
    "email": "reader@example.com",
    "password": "correct-horse-battery"
}
```

**201 Created** returns the new user. Passwords are hashed and are never included in user responses.

```json
{
  "id": "user-uuid",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:00.000Z",
  "email": "reader@example.com",
  "isChirpyRed": false
}
```

#### `POST /api/login`

Log in with an email and password.

Request:

```json
{
    "email": "reader@example.com",
    "password": "correct-horse-battery"
}
```

**200 OK** returns the user, a one-hour access token, and a refresh token:
```json
{
    "result": {
        "id": "user-uuid",
        "createdAt": "2026-01-01T12:00:00.000Z",
        "updatedAt": "2026-01-01T12:00:00.000Z",
        "email": "reader@example.com",
        "isChirpyRed": false
    },
    "token": "<access-token>",
    "refreshToken": "<refresh-token>"
}
```

**401 Unauthorized** is returned when the credential are invalid.

#### `POST /api/refresh`

Exchange a valid refresh token for a new one-hour access token. Send the refresh token as a Bearer token.

```http
Authorization: Bearer <refresh-token>
```

**204 No Content** indicates the request completed.

#### `PUT /api/users`

Update the email and password for the currently authenticated user. Requires a valid access token.

Headers:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

Request:

```json
{
    "email": "new-address@example.com",
    "password": "new-password"
}
```

**200 OK** returns the updated user object, without the password hash. **401 Unauthorized** indicates a missing or invalid token.

#### `GET /api/users`

List users, newest first. Password hashes are omitted.

**200 OK**:

```json
{
    "result": [
        {
            "id": "user-uuid",
            "createdAt": "2026-01-01T12:00:00.000Z",
            "updatedAt": "2026-01-01T12:00:00.000Z",
            "email": "reader@example.com",
            "isChirpyRed": false
        }
    ]
}
```

#### `DELETE /api/users/:userId`

Delete the authenticated user's account. Requires a valid access token whose user ID matches `:userId`. Deleting a user also removes their chirps and refresh tokens.

**204 No Content** indicates success. **401 Unauthorized** indicates a missing or invalid token. **403 Forbidden** indicates the path ID does not match the authenticated user.

### Polka webhook

#### `POST /api/polka/webhooks`

Handle Polka account events. For a `user.upgrade` event, provide the configured API key using the `ApiKey` authorization scheme:

```http
Authorization: ApiKey <POLKA_KEY>
Content-Type: application/json
```

Request:

```json
{
    "event": "user.upgrade",
    "data": {
        "userId": "user-uuid"
    }
}
```

**204 No Content** indicates the event was handled. Other event types are ignored and also return **204**. An invalid key returns **401 Unauthorized**; an unknown user returns **404 Not Found**.

### Admin and static app 

| Method    | Path             | Description                            |
| --------- | ---------------- | -------------------------------------- |
| `DELETE`  | `/admin/reset`   | Delete all users (and their related data). Available only when `PLATFORM=dev`; returns **200** on success and **403** otherwise. |
| `GET`     | `/admin/metrics` | Return an HTML page showing the number of requests served from the static app.                                                   |
| `GET`     | `/app`           | Serve the bundled web app              |

## Errors

API errors use this JSON shape:

```json
{
    "error": "description of the error"
}
```

Common status codes are **400** for invalid input, **401** for missing or invalid credentials, **403** for a forbidden action, and **404** when a requested resource is not found. Unexpected errors currently use **400** as the default status.


## Data model

- **User:** ID, email, creation/update timestamps, and an `isChirpyRed` flag.
- **Chirp:** ID, body, author ID, and creation/update timestamps.
- **Refresh token:** Token, user ID, expiry, and optional revocation timestamp.
- Deleting a user cascades to their chirps and refresh tokens.

## License

ISC 

