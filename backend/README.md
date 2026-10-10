# User Registration API

Documentation for the `POST /users/register` endpoint.

> **Route mounting note:** This documentation assumes `user.routes.js` is mounted at `/users` in the main Express application. If it is mounted at a different prefix, update the URL accordingly.

## Endpoint

- **Method:** `POST`
- **URL:** `/users/register`
- **Purpose:** Registers a new user, hashes their password, stores the user, and returns a JWT authentication token.

## Request body

Send the data as JSON with the `Content-Type: application/json` header.

```json
{
  "fullname": {
    "firstname": "Divyanshu",
    "lastname": "Sharma"
  },
  "email": "divyanshu@example.com",
  "password": "examplePassword123"
}
```

### Fields

| Field | Type | Required? | Rules / notes |
|---|---|---:|---|
| `fullname` | Object | Yes in practice | Contains the user's name fields. |
| `fullname.firstname` | String | Yes | Must be at least 3 characters. |
| `fullname.lastname` | String | No, according to current validators/schema | If provided, the model requires at least 3 characters. |
| `email` | String | Yes | Must be a valid email address. The database schema also marks it as unique. |
| `password` | String | Yes | Must be at least 6 characters. The server hashes it with bcrypt (10 salt rounds) before saving. |

The request field is named `fullname`, with nested `firstname` and `lastname` properties. Do not send the first and last names as top-level fields.

## Responses

### `201 Created` — Registration successful

The controller returns a JSON object containing the created `user` and a JWT `token`.

Example response shape:

```json
{
  "user": {
    "_id": "670000000000000000000001",
    "fullname": {
      "firstname": "Divyanshu",
      "lastname": "Sharma"
    },
    "email": "divyanshu@example.com",
    "__v": 0
  },
  "token": "<jwt-token>"
}
```

The exact user fields depend on Mongoose serialization and the current schema. The token is signed using the `JWT_SECRET` environment variable.

### `400 Bad Request` — Validation failed

Returned when one or more Express Validator checks fail. The response contains an `errors` array.

Example: invalid email or a first name shorter than 3 characters.

```json
{
  "errors": [
    {
      "type": "field",
      "value": "not-an-email",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

The actual array may contain different fields and error details depending on the invalid input.

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `201 Created` | Registration successful | User is created and the response includes the user and token. |
| `400 Bad Request` | Request validation failed | Email is invalid, `fullname.firstname` is shorter than 3 characters, or password is shorter than 6 characters. |

A duplicate email is marked as a unique field in the Mongoose schema, but this controller does not explicitly translate duplicate-key database errors into a documented HTTP status. The final response for that case depends on the application's error-handling middleware.

## Important implementation note

The `password` field is declared with `select: false`, which generally excludes it from query results by default. However, a newly created Mongoose document can still contain the password hash when serialized. Before returning `user` in the API response, explicitly remove the password field or return a safe user object containing only public fields. Never return a plaintext password or password hash to the client.

## Example request with cURL

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": {
      "firstname": "Divyanshu",
      "lastname": "Sharma"
    },
    "email": "divyanshu@example.com",
    "password": "examplePassword123"
  }'
```

Replace `http://localhost:3000` with your server's base URL and port.

---

# User Login API

Documentation for the `POST /users/login` endpoint.

## Endpoint

- **Method:** `POST`
- **URL:** `/users/login`
- **Purpose:** Authenticates an existing user using their email and password, then returns the user and a JWT authentication token.

This URL assumes `user.routes.js` is mounted at `/users` in the main Express application.

## Request body

Send JSON with the `Content-Type: application/json` header.

```json
{
  "email": "divyanshu@example.com",
  "password": "examplePassword123"
}
```

### Fields

| Field | Type | Required? | Rules / notes |
|---|---|---:|---|
| `email` | String | Yes | Must be a valid email address. |
| `password` | String | Yes | Must be at least 6 characters according to the route validator. |

## How login works

1. The request is validated.
2. The server searches for a user with the submitted email and explicitly selects the password field for verification.
3. If no user is found, the endpoint returns `401 Unauthorized`.
4. If the password does not match the stored bcrypt hash, the endpoint returns `401 Unauthorized`.
5. If the credentials match, the server generates a JWT and returns it with the user object.

The endpoint uses the same error message for an unknown email and an incorrect password: `Invalid email or password`.

## Responses

### `200 OK` — Login successful

The controller returns a JSON object containing `token` and `user`.

Example response shape:

```json
{
  "token": "<jwt-token>",
  "user": {
    "_id": "670000000000000000000001",
    "fullname": {
      "firstname": "Divyanshu",
      "lastname": "Sharma"
    },
    "email": "divyanshu@example.com",
    "__v": 0
  }
}
```

The exact user fields depend on Mongoose serialization and the current schema. The JWT is signed using the `JWT_SECRET` environment variable.

### `400 Bad Request` — Validation failed

Returned when the email is not a valid email address or the password is shorter than 6 characters. The response contains an `errors` array.

Example response:

```json
{
  "errors": [
    {
      "type": "field",
      "value": "not-an-email",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

The actual error object may vary depending on the invalid field.

### `401 Unauthorized` — Invalid credentials

Returned if the email does not match an existing user or the password is incorrect.

```json
{
  "message": "Invalid email or password"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `200 OK` | Login successful | The credentials match; the response includes a JWT and user object. |
| `400 Bad Request` | Request validation failed | The email is invalid or the password is shorter than 6 characters. |
| `401 Unauthorized` | Authentication failed | No user exists for the email, or the password is incorrect. |

## Example request with cURL

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "divyanshu@example.com",
    "password": "examplePassword123"
  }'
```

Replace `http://localhost:3000` with your server's base URL and port.

## Security note

The controller returns the Mongoose `user` document in the response. Although the schema declares `password` with `select: false`, the login query explicitly selects it with `.select('+password')` for password comparison. But the password is not getting delivered to the user it is removed from the user object before sending the response.

---

# User Profile API

Documentation for the `GET /users/profile` endpoint.

## Endpoint

- **Method:** `GET`
- **URL:** `/users/profile`
- **Purpose:** Returns the currently authenticated user's profile.
- **Authentication:** Required. The route uses `authMiddleware.authUser`.

The URL assumes `user.routes.js` is mounted at `/users` in the main Express application.

## Authentication

The middleware accepts the JWT in either of these places:

1. The `token` cookie set by the login endpoint.
2. The `Authorization` request header using the Bearer scheme.

Example header:

```http
Authorization: Bearer <jwt-token>
```

If using cookie-based authentication, send the request with cookies included in your HTTP client.

## Request body

No request body is required.

## Responses

### `200 OK` — Profile retrieved

The controller responds with `req.user`, which is populated by the authentication middleware after it verifies the JWT and loads the user from the database.

Example response shape:

```json
{
  "_id": "670000000000000000000001",
  "fullname": {
    "firstname": "Divyanshu",
    "lastname": "Sharma"
  },
  "email": "divyanshu@example.com",
  "__v": 0
}
```

The exact fields depend on the current user schema. The middleware loads the user with `findById()` and does not explicitly select the password field, which is declared with `select: false` in the schema.

### `401 Unauthorized` — Authentication failed

Returned by the authentication middleware if the token is missing, invalid, or present in the blacklist. JWT expiry only applies if expiry is configured when signing the token.

```json
{
  "message": "Unauthorized"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `200 OK` | Profile retrieved | A valid, non-blacklisted token identifies a user. |
| `401 Unauthorized` | Authentication failed | No usable token is provided, the token is invalid, or it has been blacklisted. |

## Example request with cURL

Using a Bearer token:

```bash
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer <jwt-token>"
```

If your login flow uses the `token` cookie, you can instead send that cookie with the request.

---

# User Logout API

Documentation for the `GET /users/logout` endpoint.

## Endpoint

- **Method:** `GET`
- **URL:** `/users/logout`
- **Purpose:** Logs out the currently authenticated user by clearing the `token` cookie and adding the current JWT to the token blacklist.
- **Authentication:** Required. The route uses `authMiddleware.authUser`.

The URL assumes `user.routes.js` is mounted at `/users` in the main Express application.

## Authentication

Provide the same token used for authenticated requests: either the `token` cookie or an `Authorization: Bearer <jwt-token>` header.

## Request body

No request body is required.

## How logout works

1. The authentication middleware checks for a token in the cookie or Authorization header.
2. The middleware rejects a missing or blacklisted token and verifies the JWT.
3. The controller clears the `token` cookie.
4. The controller stores the token in the blacklist.
5. The endpoint returns a success message.

The blacklist schema configures its `createdAt` field with a MongoDB TTL of 86,400 seconds (24 hours).

## Responses

### `200 OK` — Logout successful

```json
{
  "message": "Logged out successfully"
}
```

### `401 Unauthorized` — Authentication failed

The authentication middleware returns this response if the token is missing, invalid, or already blacklisted.

```json
{
  "message": "Unauthorized"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `200 OK` | Logout successful | The authenticated token is added to the blacklist and the cookie is cleared. |
| `401 Unauthorized` | Authentication failed | The request does not contain a usable token, or the token is invalid or blacklisted. |

Database or unexpected server errors are not explicitly mapped to a status code in this controller; their response depends on the application's error-handling middleware.

## Example request with cURL

Using a Bearer token:

```bash
curl -X GET http://localhost:3000/users/logout \
  -H "Authorization: Bearer <jwt-token>"
```

For cookie-based authentication, send the `token` cookie with the request. The server clears that cookie in the response.

## Implementation note

The logout controller reads the token from `req.cookies.token` or the Authorization header after clearing the cookie in the response. Clearing the response cookie does not normally remove the already-parsed request cookie, so the existing token can still be read during that request. For robustness, consider extracting the token before calling `res.clearCookie()`, and use optional chaining when reading the Authorization header.

