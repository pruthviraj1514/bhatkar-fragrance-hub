# Frontend Authentication Integration Guide

## Overview
The frontend is now fully connected to the backend authentication APIs. Both Login and Sign Up forms are working with real backend endpoints.

## Backend APIs Used

### 1. **Sign Up API**
- **Endpoint**: `POST /api/auth/signup`
- **URL**: `http://localhost:3000/api/auth/signup`
- **Request Body**:
  ```json
  {
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response Success**:
  ```json
  {
    "status": "success",
    "data": {
      "token": "jwt_token_here",
      "data": {
        "id": 1,
        "firstname": "John",
        "lastname": "Doe",
        "email": "john@example.com"
      }
    }
  }
  ```

### 2. **Sign In API**
- **Endpoint**: `POST /api/auth/signin`
- **URL**: `http://localhost:3000/api/auth/signin`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response Success**:
  ```json
  {
    "status": "success",
    "data": {
      "token": "jwt_token_here",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com"
    }
  }
  ```

## Frontend Changes

### 1. **AuthContext.tsx** - Updated with real API calls
- Added `signup` function that calls `/api/auth/signup`
- Updated `login` function to call `/api/auth/signin`
- Both functions now:
  - Make actual HTTP requests to backend
  - Store JWT token in localStorage
  - Store user data in localStorage
  - Handle errors properly

**Key Features**:
- Uses `VITE_API_URL` environment variable (default: `http://localhost:3000`)
- Handles both login and signup flows
- Proper error handling with user-friendly messages
- Token and user persistence

### 2. **AuthModal.tsx** - Updated signup form
- Now splits full name into `firstname` and `lastname`
- Calls `signup()` function instead of just `login()`
- Proper validation:
  - Password match check
  - Minimum 6 characters
  - Name required
  - Email format validation (backend)

## Setup Instructions

### 1. **Backend Setup**
```bash
cd backend
npm install
npm run db:init      # Initialize database
npm run dev          # Start backend on port 3000
```

### 2. **Frontend Setup**
```bash
npm install
# Create .env.local file with:
# VITE_API_URL=http://localhost:3000
npm run dev          # Start frontend
```

### 3. **Environment Variables**
Create `.env.local` in the project root:
```
VITE_API_URL=http://localhost:3000
```

## How to Use

### Login Flow
1. Click the "Login" button in the header
2. Enter your registered email
3. Enter your password
4. Click "Log In"
5. On success:
   - JWT token saved to localStorage
   - User data displayed in profile menu
   - Modal closes automatically

### Sign Up Flow
1. Click "Sign Up" link in the login modal
2. Enter your full name
3. Enter your email
4. Enter password (min 6 chars)
5. Confirm password
6. Click "Sign Up"
7. On success:
   - User account created in database
   - JWT token saved to localStorage
   - Automatically logged in
   - Modal closes automatically

## Error Handling

Both forms display user-friendly error messages:
- Invalid email format
- Password too short
- Passwords don't match
- Duplicate email (backend validation)
- Incorrect password
- User not found
- Any server errors

## Data Stored Locally

After successful authentication:

**localStorage keys**:
- `auth_token`: JWT token for API requests
- `auth_user`: User object with id, email, name, firstname, lastname

**Example user object**:
```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe",
  "firstname": "John",
  "lastname": "Doe"
}
```

## Testing

### Test Sign Up
1. Go to frontend
2. Open Auth Modal
3. Switch to Sign Up tab
4. Enter: Name: "Test User", Email: "test@example.com", Password: "password123"
5. Click Sign Up
6. Check browser console and verify JWT token is stored

### Test Login
1. After signup, click logout in profile menu
2. Click login button
3. Enter email: "test@example.com", Password: "password123"
4. Verify you're logged back in

## Files Modified

1. `/src/contexts/AuthContext.tsx` - Real API integration
2. `/src/components/auth/AuthModal.tsx` - Updated signup handling
3. `/.env.local` - API URL configuration (created)

## Next Steps

Once authentication is working, you can:
1. Add protected routes for authenticated users only
2. Include JWT token in API requests to other endpoints
3. Implement "Remember Me" functionality
4. Add email verification
5. Implement password reset functionality
6. Add social login (Google, GitHub, etc.)
