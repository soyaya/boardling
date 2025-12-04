# Task 45.3: Project ID Fix

## Problem

The onboarding flow was failing with the error:
```
ConnectWalletStep.tsx:112 Project ID is undefined after creation
```

This occurred when trying to create a wallet during the onboarding process.

## Root Cause

In `src/components/onboarding/ConnectWalletStep.tsx`, the component was not properly accessing the `createdProjectId` from the onboarding store. The variable was referenced in the `handleSubmit` function but was never destructured from the store at the component level.

### The Issue

```typescript
// At component level - createdProjectId was NOT destructured
const { projectData, updateProjectData, setCreatedProjectId } = useOnboardingStore();

// In handleSubmit function - trying to use undefined variable
let projectId = createdProjectId; // ❌ createdProjectId is undefined!
```

## Solution

Added `createdProjectId`, `setCreatedWalletId`, and `setIsCompleting` to the destructured values from the onboarding store:

```typescript
const { 
  projectData, 
  createdProjectId,           // ✅ Now properly destructured
  updateProjectData, 
  setCreatedProjectId,
  setCreatedWalletId,         // ✅ Also added for consistency
  setIsCompleting             // ✅ Also added for consistency
} = useOnboardingStore();
```

## How It Works Now

1. **First Time Through**: 
   - `createdProjectId` is `null`
   - Project is created via `createProject()`
   - Project ID is extracted from response: `projectId = project.id`
   - Project ID is stored: `setCreatedProjectId(projectId)`
   - Wallet is created with the project ID

2. **Resume After Logout**:
   - `createdProjectId` exists from persisted store
   - Project creation is skipped
   - Wallet is created with existing project ID

## Additional Improvements

1. **Better Logging**: Added console logs to track the flow:
   - "Creating new project..."
   - "Project created with ID: {id}"
   - "Using existing project ID: {id}"
   - "Creating wallet with project_id: {id}"

2. **Better Error Messages**: Enhanced error handling to show actual error messages instead of generic ones

3. **Validation**: Added checks to ensure project ID exists before attempting wallet creation

## Testing

To test the fix:

1. **New User Flow**:
   ```bash
   # Register a new user
   # Complete onboarding with project and wallet
   # Should see console logs showing project creation
   ```

2. **Resume Flow**:
   ```bash
   # Start onboarding
   # Logout before completing
   # Login again
   # Should see console log "Using existing project ID"
   ```

## Files Modified

- `src/components/onboarding/ConnectWalletStep.tsx`
  - Added missing store value destructuring
  - Improved logging
  - Enhanced error handling

## Related Files

- `src/store/useOnboardingStore.ts` - Onboarding state management
- `src/store/useProjectStore.ts` - Project creation logic
- `backend/src/routes/project.js` - Project API endpoint
- `backend/src/controllers/wallet.js` - Wallet creation logic

## Additional Fixes

### Wallet Duplicate Error Handling

Updated error display to show both error code and message from the API response:

```typescript
// Before: Only showed generic error
setError(walletResponse.error || 'Failed to add wallet');

// After: Shows full error message
const errorCode = walletResponse.error;
const errorMessage = walletResponse.message || 'Failed to add wallet';
setError(errorMessage);
```

Now when a wallet already exists, users see:
- "Wallet address already exists for this network" (clear, actionable message)

Instead of:
- "BAD_REQUEST" (cryptic error code)

### Database Cleanup Script

Created `backend/scripts/delete-all-wallets.js` for testing purposes:
```bash
node backend/scripts/delete-all-wallets.js
```

## Status

✅ **FIXED** - Project ID is now properly tracked and passed to wallet creation
✅ **FIXED** - Error messages now show user-friendly descriptions instead of error codes
✅ **ADDED** - Database cleanup script for testing
