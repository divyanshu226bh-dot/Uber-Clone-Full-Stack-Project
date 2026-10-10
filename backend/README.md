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

### `201 OK` — Registration successful

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
| `201 OK` | Registration successful | User is created and the response includes the user and token. |
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
