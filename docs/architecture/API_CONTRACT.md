# API Contract - Frontend ↔ Backend

## Authentication Endpoints

### POST /auth/register

**Backend Expects:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Backend Returns (Success - 201):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

**Backend Returns (Error - 400):**
```json
{
  "error": "string",
  "message": "string (optional)"
}
```

**Frontend Behavior:**
- Collects: name, email, company (optional), password, confirmPassword
- Sends to backend: name, email, password only
- On success: Redirects to /signin with success message
- Does NOT authenticate user (no token returned)

---

### POST /auth/login

**Backend Expects:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Backend Returns (Success - 200):**
```json
{
  "token": "string (JWT)"
}
```

**Backend Returns (Error - 401/400):**
```json
{
  "error": "string",
  "message": "string (optional)"
}
```

**Frontend Behavior:**
- Sends: email, password
- On success: Stores JWT token, decodes to get user info
- Redirects to /dashboard or intended destination

---

### POST /auth/change-password

**Backend Expects:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required)"
}
```

**Headers Required:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Backend Returns (Success - 200):**
```json
{
  "message": "Password updated successfully"
}
```

---

### POST /auth/forgot-password

**Backend Expects:**
```json
{
  "email": "string (required)"
}
```

**Backend Returns (Success - 200):**
```json
{
  "message": "If the email exists, a reset link has been sent",
  "resetToken": "string (dev only - remove in production)"
}
```

---

### POST /auth/reset-password

**Backend Expects:**
```json
{
  "resetToken": "string (required)",
  "newPassword": "string (required)"
}
```

**Backend Returns (Success - 200):**
```json
{
  "message": "Password reset successfully"
}
```

---

## Current Configuration

**Backend URL:** `http://localhost:3002`  
**Frontend URL:** `http://localhost:5173`  
**Database:** PostgreSQL on `localhost:5432`

## User Flow

1. **Registration:**
   - User fills form: name, email, password, confirmPassword
   - Frontend validates: passwords match, email format, password length
   - Frontend sends: name, email, password
   - Backend creates user, returns user object (no token)
   - Frontend redirects to /signin with success message

2. **Login:**
   - User enters: email, password
   - Backend validates credentials
   - Backend returns: JWT token
   - Frontend decodes token, extracts user info
   - Frontend stores token and user data
   - Frontend redirects to dashboard

3. **Protected Routes:**
   - Frontend checks for valid JWT token
   - If no token or expired: redirect to /signin
   - If valid: allow access to protected routes

## Notes

- Backend does NOT return a token on registration
- User must login after registration to get a token
- JWT token expires in 1 hour
- Frontend stores token in localStorage
- Company field is collected but not sent to backend (for future use)