# Quick Onboarding Flow Test

## Issue: "Project ID is required" error

### Possible Causes:
1. Project creation failed but didn't show error
2. `projectId` variable is undefined
3. `createdProjectId` from store is not set

### Debug Steps:

1. **Open Browser Console** (F12)
2. **Register/Login** to your account
3. **Go to Onboarding** (`/onboarding`)
4. **Fill the form** with:
   - Project Name: "Test Project"
   - Category: "DeFi"
   - Wallet Address: `t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak`
5. **Click "Create Project"**
6. **Watch Console** for these logs:
   - "Creating wallet with data: ..."
   - "Wallet created successfully: ..."
   - OR error messages

### Expected Console Output:

```
Creating wallet with data: { project_id: "uuid-123", address: "t1at7nVNs...", label: "Main Wallet", privacy_mode: "private" }
Wallet created successfully: { id: "uuid-456", address: "t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak", ... }
```

### If You See "Project ID is undefined":

This means project creation failed. Check:
- Network tab for `/api/projects` request
- Response status and body
- Any errors in backend logs

### If You See "Project ID is required":

This means `projectId` is null/undefined. Check:
- Did project creation succeed?
- Is `project.id` being returned from `createProject()`?
- Is `setCreatedProjectId()` being called?

### Backend Logs:

Check backend console for:
```
POST /api/projects - 201 Created
POST /api/wallets - 400 Bad Request (if error)
```

### Quick Fix Test:

Try this in browser console after filling the form:
```javascript
// Check onboarding store
const store = window.__ZUSTAND_STORES__?.onboarding;
console.log('Onboarding Store:', store?.getState());
```

### Manual API Test:

```bash
# 1. Register/Login and get token
TOKEN="your_jwt_token"

# 2. Create project
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "category": "defi",
    "description": "Test"
  }'

# Response should include: { "success": true, "project": { "id": "uuid-123", ... } }

# 3. Create wallet with project ID
curl -X POST http://localhost:3001/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "uuid-123",
    "address": "t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak",
    "label": "Main Wallet",
    "privacy_mode": "private"
  }'

# Should return: { "success": true, "data": { "id": "uuid-456", ... } }
```

### Solution:

The code now includes:
1. ✅ Validation that `projectId` exists before wallet creation
2. ✅ Console logging for debugging
3. ✅ Better error messages
4. ✅ Proper handling of response structure

Try the onboarding flow again and check the console logs to see exactly where it's failing.
