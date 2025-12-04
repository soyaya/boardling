# Quick Start Testing Guide

## Current Status

✅ **Frontend**: Running on `http://localhost:5173`  
✅ **Backend**: Running on `http://localhost:3001`  
⚠️ **Database**: Not connected (PostgreSQL required)

## Option 1: Start Database with Docker (Recommended)

If you have Docker installed, run this command in your terminal:

```bash
docker run --name boardling-postgres -e POSTGRES_PASSWORD=boardling123 -e POSTGRES_USER=boardling -e POSTGRES_DB=boardling -p 5432:5432 -d postgres:15
```

Then initialize the database:

```bash
cd boardling/backend
node setup-database.js
```

## Option 2: Test Without Database (Quick Testing)

For quick testing without database setup, you can test the frontend UI:

### What Works Without Database:
- ✅ Frontend UI and navigation
- ✅ Form validation
- ✅ Component rendering
- ✅ Protected route logic
- ✅ Error handling

### What Requires Database:
- ❌ User registration (POST /auth/register)
- ❌ User login (POST /auth/login)
- ❌ Project creation
- ❌ Wallet management
- ❌ Analytics data

## Testing the Frontend (No Database Required)

You can still test the frontend components and UI:

1. **Visit**: `http://localhost:5173`
2. **Test Pages**:
   - Landing page: `/`
   - Sign Up form: `/signup` (UI only)
   - Sign In form: `/signin` (UI only)
   - Features: `/features`
   - Pricing: `/pricing`

3. **Test Components**:
   - Form validation works
   - Error messages display
   - Loading states work
   - Navigation works

## Performance Optimization

The frontend has been optimized with:
- ✅ Error boundaries for crash prevention
- ✅ Lazy loading for better performance
- ✅ Non-blocking auth initialization
- ✅ Loading screens

## Full Testing (With Database)

Once the database is running:

1. **Register**: `http://localhost:5173/signup`
   - Create a new account
   - Should redirect to onboarding

2. **Login**: `http://localhost:5173/signin`
   - Use your credentials
   - Should redirect to dashboard

3. **Protected Routes**: Try accessing `/dashboard` without login
   - Should redirect to sign in

4. **Complete Flow**:
   - Sign Up → Onboarding → Project Creation → Wallet Addition → Dashboard

## Troubleshooting

### Slow Frontend Loading
- Clear browser cache
- Check browser console for errors
- Ensure backend is running on port 3001

### Database Connection Failed
- Ensure PostgreSQL is running on port 5432
- Check credentials in `backend/.env`
- Run `docker ps` to verify container is running

### Backend Errors
- Check `backend/.env` configuration
- Ensure all environment variables are set
- Check backend console for detailed errors

## Quick Commands

```bash
# Start backend
cd boardling/backend
npm start

# Start frontend
cd boardling
npm run dev

# Check Docker containers
docker ps

# Stop database
docker stop boardling-postgres

# Start existing database
docker start boardling-postgres

# Remove database (to start fresh)
docker rm -f boardling-postgres
```

## Next Steps

1. ✅ Frontend and backend are running
2. ⚠️ Start PostgreSQL database
3. ⚠️ Initialize database schema
4. ✅ Test complete user flow

The system is ready for UI testing now, and will be fully functional once the database is connected!