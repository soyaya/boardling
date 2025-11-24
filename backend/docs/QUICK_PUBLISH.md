# Quick Publish Reference

## 🚀 One-Command Publish

```bash
# Run all checks and publish
npm run publish-sdk
```

## 📋 Step-by-Step Commands

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm test

# 3. Build package
npm run build

# 4. Check everything is ready
npm run pre-publish

# 5. Login to NPM (if not already)
npm login

# 6. Publish
npm publish
# OR for scoped packages:
npm publish --access public
```

## 🔧 Useful Commands

```bash
# Test package locally
npm run pack-test

# Check what will be published
npm pack --dry-run

# Check NPM login status
npm whoami

# Check if package name is available
npm view zcash-paywall-sdk

# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

## 📦 Package Info

- **Name:** zcash-paywall-sdk
- **Entry Points:**
  - CommonJS: `dist/ZcashPaywall.cjs`
  - ES Module: `src/ZcashPaywall.js`
  - TypeScript: `dist/index.d.ts`

## 🎯 After Publishing

Your package will be available at:
- https://www.npmjs.com/package/zcash-paywall-sdk

Install with:
```bash
npm install zcash-paywall-sdk
```

Use with:
```javascript
import { ZcashPaywall } from 'zcash-paywall-sdk';
```