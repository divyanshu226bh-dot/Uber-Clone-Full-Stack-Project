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

---

# Captain Registration API

Documentation for the `POST /captains/register` endpoint.

## Endpoint

- **Method:** `POST`
- **URL:** `/captains/register`
- **Purpose:** Registers a new captain with personal and vehicle details, then returns a JWT authentication token and the created captain object.

The URL is confirmed by `app.js`, which mounts the captain routes at `/captains`.

## Request body

Send the data as JSON with the `Content-Type: application/json` header.

```json
{
  "fullname": {
    "firstname": "Rahul",
    "lastname": "Sharma"
  },
  "email": "rahul@example.com",
  "password": "examplePassword123",
  "vehicle": {
    "color": "White",
    "plate": "RJ14AB1234",
    "capacity": 4,
    "vehicleType": "car"
  }
}
```

### Fields

| Field | Type | Required? | Rules / notes |
|---|---|---:|---|
| `fullname` | Object | Yes in practice | Contains the captain's name fields. |
| `fullname.firstname` | String | Yes | Must be at least 3 characters. |
| `fullname.lastname` | String | Optional in route validator/schema | If provided, it must be at least 3 characters according to the schema. |
| `email` | String | Yes | Must be a valid email address. The schema converts it to lowercase and marks it as unique. |
| `password` | String | Yes | Must be at least 6 characters. The server hashes it with bcrypt using 10 salt rounds. |
| `vehicle` | Object | Yes in practice | Contains the captain's vehicle information. |
| `vehicle.color` | String | Yes | Must be at least 3 characters. |
| `vehicle.plate` | String | Yes | Must be at least 3 characters. |
| `vehicle.capacity` | Integer | Yes | Must be at least 1. |
| `vehicle.vehicleType` | String | Yes | Must be one of `car`, `motorcycle`, or `auto`. |

The request uses nested fields: `fullname.firstname`, `fullname.lastname`, and `vehicle.*`.

## How registration works

1. Express Validator checks the request fields.
2. The controller checks whether a captain with the submitted email already exists.
3. If the email is already registered, the endpoint returns `400 Bad Request`.
4. Otherwise, the password is hashed and the captain record is created.
5. A JWT is generated. The captain model configures it to expire after 24 hours.
6. The endpoint responds with `201 Created`, the token, and the captain object.

## Responses

### `201 Created` — Registration successful

The controller returns a JSON object containing `token` and `captain`.

Example response shape:

```json
{
  "token": "<jwt-token>",
  "captain": {
    "_id": "670000000000000000000002",
    "fullname": {
      "firstname": "Rahul",
      "lastname": "Sharma"
    },
    "email": "rahul@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "White",
      "plate": "RJ14AB1234",
      "capacity": 4,
      "vehicleType": "car"
    },
    "__v": 0
  }
}
```

This is an example response shape; generated IDs and serialized fields will vary.

### `400 Bad Request` — Validation failed

Returned when one or more Express Validator checks fail. The response contains an `errors` array.

Example:

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

The exact error object depends on which field failed validation.

### `400 Bad Request` — Captain already exists

Returned when the controller finds an existing captain with the submitted email.

```json
{
  "message": "Captain already exist"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `201 Created` | Registration successful | The captain is created and the response includes a JWT and captain object. |
| `400 Bad Request` | Request validation failed | Email is invalid, first name is shorter than 3 characters, password is shorter than 6 characters, or vehicle fields fail validation. |
| `400 Bad Request` | Captain already exists | A captain with the submitted email is already present. |

## Example request with cURL

```bash
curl -X POST http://localhost:3000/captains/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": {
      "firstname": "Rahul",
      "lastname": "Sharma"
    },
    "email": "rahul@example.com",
    "password": "examplePassword123",
    "vehicle": {
      "color": "White",
      "plate": "RJ14AB1234",
      "capacity": 4,
      "vehicleType": "car"
    }
  }'
```

Replace `http://localhost:3000` with your server's base URL and port.

## Security note

The captain schema declares `password` with `select: false`, but the registration controller returns the newly created `captain` document directly. To avoid exposing the password hash, remove `password` from a plain object or return a safe captain object containing only public fields before sending the response.


---

# Captain Login API

Documentation for the `POST /captains/login` endpoint.

## Endpoint

- **Method:** `POST`
- **URL:** `/captains/login`
- **Purpose:** Authenticates an existing captain using email and password, then returns a JWT and captain object.

The URL assumes the captain router is mounted at `/captains` in the main Express application.

## Request body

Send JSON with the `Content-Type: application/json` header.

```json
{
  "email": "rahul@example.com",
  "password": "examplePassword123"
}
```

### Fields

| Field | Type | Required? | Rules / notes |
|---|---|---:|---|
| `email` | String | Yes | Must be a valid email address. |
| `password` | String | Yes | Must be at least 6 characters according to the route validator. |

## How login works

1. Express Validator checks the email and password fields.
2. The controller searches for a captain by email and explicitly selects the password field for verification.
3. If no captain is found, the endpoint returns `401 Unauthorized`.
4. If the password does not match, the endpoint returns `401 Unauthorized`.
5. If the credentials match, the server generates a JWT, sets it in the `token` cookie, removes the password from the response object, and returns the token and captain object.

The same error message is used for an unknown email and an incorrect password: `Invalid email or password`.

## Responses

### `200 OK` — Login successful

```json
{
  "token": "<jwt-token>",
  "captain": {
    "_id": "670000000000000000000002",
    "fullname": {
      "firstname": "Rahul",
      "lastname": "Sharma"
    },
    "email": "rahul@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "White",
      "plate": "RJ14AB1234",
      "capacity": 4,
      "vehicleType": "car"
    },
    "__v": 0
  }
}
```

This is an example response shape; the actual fields depend on the captain schema and serialized document. The password is explicitly removed before the captain object is returned.

### `400 Bad Request` — Validation failed

Returned when the email is not valid or the password is shorter than 6 characters. The response contains an `errors` array.

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

The exact error object depends on the field that failed validation.

### `401 Unauthorized` — Invalid credentials

Returned when the email is not associated with a captain or the password is incorrect.

```json
{
  "message": "Invalid email or password"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `200 OK` | Login successful | Credentials match; the response includes a JWT and captain object. |
| `400 Bad Request` | Request validation failed | Email is invalid or password is shorter than 6 characters. |
| `401 Unauthorized` | Authentication failed | Captain does not exist for the email, or the password is incorrect. |

## Example request with cURL

```bash
curl -X POST http://localhost:3000/captains/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahul@example.com",
    "password": "examplePassword123"
  }'
```

Replace `http://localhost:3000` with your server's base URL and port.

## Authentication cookie note

On successful login, the controller sets a cookie named `token`. The JWT is also returned in the JSON response, so clients can use either the cookie or an `Authorization: Bearer <jwt-token>` header for protected captain routes.

---

# Captain Profile API

Documentation for the `GET /captains/profile` endpoint.

## Endpoint

- **Method:** `GET`
- **URL:** `/captains/profile`
- **Purpose:** Returns the currently authenticated captain's profile.
- **Authentication:** Required. The route uses `authMiddleware.authCaptain`.

## Authentication

The middleware accepts the JWT from either:

1. The `token` cookie.
2. The `Authorization` header using the Bearer scheme.

Example header:

```http
Authorization: Bearer <jwt-token>
```

If using cookie-based authentication, send the request with cookies included in your HTTP client.

## Request body

No request body is required.

## How the endpoint works

1. The authentication middleware reads the token from the cookie or Authorization header.
2. It rejects missing or blacklisted tokens, verifies the JWT, and loads the captain by the ID in the token.
3. The middleware attaches the captain document to `req.captain`.
4. The controller returns `req.captain` with status `200 OK`.

## Responses

### `200 OK` — Profile retrieved

Example response shape:

```json
{
  "_id": "670000000000000000000002",
  "fullname": {
    "firstname": "Rahul",
    "lastname": "Sharma"
  },
  "email": "rahul@example.com",
  "status": "inactive",
  "vehicle": {
    "color": "White",
    "plate": "RJ14AB1234",
    "capacity": 4,
    "vehicleType": "car"
  },
  "__v": 0
}
```

This is an illustrative response; fields depend on the captain schema. The middleware uses `findById()` without explicitly selecting the password field, and the schema declares password with `select: false`.

### `401 Unauthorized` — Authentication failed

Returned if the token is missing, invalid, expired, or blacklisted.

```json
{
  "message": "Unauthorized"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `200 OK` | Profile retrieved | A valid, non-blacklisted JWT identifies a captain. |
| `401 Unauthorized` | Authentication failed | The token is missing, invalid, expired, or blacklisted. |

## Example request with cURL

Using a Bearer token:

```bash
curl http://localhost:3000/captains/profile \
  -H "Authorization: Bearer <jwt-token>"
```

For cookie-based authentication, send the `token` cookie with the request.

---

# Captain Logout API

Documentation for the `GET /captains/logout` endpoint.

## Endpoint

- **Method:** `GET`
- **URL:** `/captains/logout`
- **Purpose:** Logs out the authenticated captain by clearing the `token` cookie and adding the current JWT to the token blacklist.
- **Authentication:** Required. The route uses `authMiddleware.authCaptain`.

## Authentication

Provide the JWT using either the `token` cookie or an `Authorization: Bearer <jwt-token>` header. The middleware verifies the token and rejects missing, invalid, or already-blacklisted tokens before the controller runs.

## Request body

No request body is required.

## How logout works

1. The authentication middleware validates the current token.
2. The controller reads the token from the cookie or Authorization header.
3. It clears the `token` cookie.
4. It stores the token in the blacklist.
5. It returns a success message.

Once blacklisted, the token will be rejected by the captain authentication middleware on later requests.

## Responses

### `200 OK` — Logout successful

```json
{
  "message": "Logged out successfully"
}
```

### `401 Unauthorized` — Authentication failed

Returned by the authentication middleware if the token is missing, invalid, expired, or already blacklisted.

```json
{
  "message": "Unauthorized"
}
```

## Status codes implemented by this endpoint

| Status code | Meaning | When it is returned |
|---|---|---|
| `200 OK` | Logout successful | The token is added to the blacklist and the cookie is cleared. |
| `401 Unauthorized` | Authentication failed | No usable token is provided, or the token is invalid or blacklisted. |

Unexpected database errors are not explicitly mapped to a response in this controller; their final status depends on the application's error-handling middleware.

## Example request with cURL

Using a Bearer token:

```bash
curl -X GET http://localhost:3000/captains/logout \
  -H "Authorization: Bearer <jwt-token>"
```

For cookie-based authentication, send the `token` cookie with the request. The server clears that cookie in the response.

## Implementation note

The logout controller accesses `req.headers["authorization"].split(" ")[1]` if there is no token cookie. Although the middleware supports Bearer-token authentication, this expression can throw if the Authorization header is absent and no cookie is available. Consider using optional chaining or extracting the token safely before using it.
