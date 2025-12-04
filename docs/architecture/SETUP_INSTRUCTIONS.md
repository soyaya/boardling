# Setup Instructions - Complete System

## ✅ Current Status

- **PostgreSQL**: Running on port 5432
- **Backend**: Running on port 3002
- **Frontend**: Running on port 5173
- **Database**: Connected successfully

## 🔧 Initialize Authentication Tables

Run this command in your terminal (from the backend directory):

```bash
cd boardling/backend
psql -U zcash_user -d zcash_indexer -h localhost -f init-auth-tables.sql
```

**Or manually in psql:**

```bash
psql -U zcash_user -d zcash_indexer -h localhost
```

Then paste the contents of `backend/init-auth-tables.sql`

## 🧪 Test the System

### 1. Test Registration

1. Go to: `http://localhost:5173/signup`
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Create account"
4. You should be redirected to `/signin` with a success message

### 2. Test Login

1. On the sign-in page (email should be pre-filled)
2. Enter your password
3. Click "Sign in"
4. You should be redirected to `/dashboard` with a JWT token

### 3. Test Protected Routes

1. Try accessing `/dashboard` without logging in
2. You should be redirected to `/signin`
3. After logging in, you should be able to access all protected routes

## 📊 System Architecture

```
Frontend (Port 5173)
    ↓
Backend API (Port 3002)
    ↓
PostgreSQL (Port 5432)
    - Database: zcash_indexer
    - User: zcash_user
```

## 🔑 API Endpoints

- **POST** `/auth/register` - Register new user
- **POST** `/auth/login` - Login and get JWT token
- **POST** `/auth/change-password` - Change password (requires auth)
- **POST** `/auth/forgot-password` - Request password reset
- **POST** `/auth/reset-password` - Reset password with token

## 🗄️ Database Tables

- **users** - User accounts (id, name, email, password_hash)
- **projects** - Analytics projects (id, user_id, name, description)
- **wallets** - Zcash wallets (id, project_id, address, label, wallet_type)

## 🐛 Troubleshooting

### Backend Connection Refused

```bash
# Check if backend is running
# Should show process on port 3002
netstat -ano | findstr :3002

# Restart backend if needed
cd boardling/backend
npm start
```

### Database Connection Failed

```bash
# Check PostgreSQL status
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Test connection
psql -U zcash_user -d zcash_indexer -h localhost
```

### Frontend Can't Connect

1. Check `.env` file has: `VITE_API_BASE_URL=http://localhost:3002`
2. Restart frontend: `npm run dev`
3. Clear browser cache

## 📝 Next Steps

1. ✅ Initialize database tables (run SQL script)
2. ✅ Test registration flow
3. ✅ Test login flow
4. ✅ Test protected routes
5. ✅ Create a project
6. ✅ Add wallets to project
7. ✅ Access analytics dashboard

## 🎉 You're Ready!

Once the database tables are initialized, the complete user registration and authentication system will be fully functional!