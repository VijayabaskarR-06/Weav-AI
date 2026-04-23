# Authentication Flow

Signup stores a bcrypt password hash in MySQL and returns a JWT.

Login verifies the password hash and returns a JWT.

Protected routes require:

```text
Authorization: Bearer <token>
```
