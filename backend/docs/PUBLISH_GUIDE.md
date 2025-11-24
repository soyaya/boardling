# Zcash Paywall SDK - NPM Publishing Guide

This guide walks you through the complete process of building and publishing the Zcash Paywall SDK to NPM.

## Prerequisites

- Node.js >= 18.0.0
- NPM account (create at [npmjs.com](https://www.npmjs.com/signup))
- Git repository (optional but recommended)

## Step 1: Prepare Your Environment

### 1.1 Navigate to the backend directory
```bash
cd backend
```

### 1.2 Install dependencies
```bash
npm install
```

### 1.3 Verify your package.json
Check that your `package.json` has the correct information:
```json
{
  "name": "zcash-paywall-sdk",
  "version": "1.0.0",
  "description": "Production-ready Zcash paywall SDK for Node.js with subscription and one-time payment support",
  "main": "dist/ZcashPaywall.cjs",
  "module": "src/ZcashPaywall.js",
  "types": "dist/index.d.ts"
}
```

## Step 2: Build the Package

### 2.1 Run tests to ensure everything works
```bash
npm test
```
Expected output: All tests should pass ✅

### 2.2 Build the distribution files
```bash
npm run build
```
This will:
- Compile ES modules to CommonJS for compatibility
- Generate TypeScript definitions
- Create the `dist/` directory

### 2.3 Verify build output
```bash
ls -la dist/
```
You should see:
- `ZcashPaywall.cjs` - Main CommonJS entry point
- `index.d.ts` - TypeScript definitions
- `api/`, `sdk/`, `testing/`, `utils/` directories

## Step 3: Test the Package Locally

### 3.1 Create a package tarball
```bash
npm pack
```
This creates `zcash-paywall-sdk-1.0.0.tgz`

### 3.2 Test the package structure
```bash
tar -tzf zcash-paywall-sdk-1.0.0.tgz | head -20
```

### 3.3 Test local installation (optional)
```bash
# In a separate directory
mkdir ../test-sdk
cd ../test-sdk
npm init -y
npm install ../backend/zcash-paywall-sdk-1.0.0.tgz

# Test import
node -e "
const { ZcashPaywall } = require('zcash-paywall-sdk');
console.log('✅ CommonJS import works');
"

node -e "
import { ZcashPaywall } from 'zcash-paywall-sdk';
console.log('✅ ES module import works');
" --input-type=module
```

## Step 4: NPM Account Setup

### 4.1 Create NPM account (if you don't have one)
Visit [npmjs.com/signup](https://www.npmjs.com/signup) and create an account.

### 4.2 Login to NPM
```bash
cd backend  # Make sure you're in the backend directory
npm login
```
Enter your:
- Username
- Password  
- Email
- One-time password (if 2FA is enabled)

### 4.3 Verify login
```bash
npm whoami
```
Should display your NPM username.

## Step 5: Check Package Name Availability

### 5.1 Check if the package name is available
```bash
npm view zcash-paywall-sdk
```

**If you get an error (404):** ✅ Name is available, proceed to Step 6.

**If you get package info:** ❌ Name is taken, go to Step 5.2.

### 5.2 Choose an alternative name (if needed)

Option A: Use a scoped package
```bash
# Update package.json name to:
"name": "@your-username/zcash-paywall-sdk"
```

Option B: Choose a different name
```bash
# Update package.json name to something like:
"name": "zcash-paywall-client"
"name": "broadling-zcash-sdk"
"name": "your-unique-zcash-sdk"
```

## Step 6: Final Pre-publish Checks

### 6.1 Lint your code
```bash
npm run lint
```

### 6.2 Run all tests one more time
```bash
npm test
```

### 6.3 Check what files will be published
```bash
npm pack --dry-run
```

### 6.4 Verify package.json scripts work
```bash
# Test the main entry point
node -e "const sdk = require('./dist/ZcashPaywall.cjs'); console.log('✅ CJS works');"
node -e "import('./src/ZcashPaywall.js').then(() => console.log('✅ ESM works'));"
```

## Step 7: Publish to NPM

### 7.1 Publish the package
```bash
npm publish
```

**For scoped packages:**
```bash
npm publish --access public
```

### 7.2 Verify publication
```bash
npm view zcash-paywall-sdk
# or
npm view @your-username/zcash-paywall-sdk
```

## Step 8: Post-Publication

### 8.1 Test installation from NPM
```bash
# In a new directory
mkdir ../test-npm-install
cd ../test-npm-install
npm init -y
npm install zcash-paywall-sdk
```

### 8.2 Create a simple test
```javascript
// test-install.js
import { ZcashPaywall } from 'zcash-paywall-sdk';

const paywall = new ZcashPaywall({
  baseURL: 'http://localhost:3000'
});

console.log('✅ SDK installed and imported successfully!');
console.log('Available APIs:', Object.keys(paywall));
```

```bash
node test-install.js
```

### 8.3 Update your documentation
Add installation instructions to your README:
```markdown
## Installation
\`\`\`bash
npm install zcash-paywall-sdk
\`\`\`
```

## Step 9: Version Management (Future Updates)

### 9.1 Update version for future releases
```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)  
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

### 9.2 Publish updates
```bash
npm run build
npm test
npm publish
```

## Troubleshooting

### Common Issues and Solutions

**Issue: "need auth This command requires you to be logged in"**
```bash
npm login
```

**Issue: "Package name too similar to existing package"**
- Use a scoped package: `@username/package-name`
- Choose a more unique name

**Issue: "Version already exists"**
```bash
npm version patch
npm publish
```

**Issue: "Build fails"**
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

**Issue: "Tests fail"**
```bash
# Check test output and fix issues
npm test -- --verbose
```

## Success Checklist

- [ ] All tests pass
- [ ] Build completes without errors
- [ ] Package name is available or scoped
- [ ] NPM login successful
- [ ] Local package test works
- [ ] Published successfully
- [ ] Can install from NPM
- [ ] Documentation updated

## Package Information

After successful publication, your package will be available at:
- **NPM Page:** `https://www.npmjs.com/package/zcash-paywall-sdk`
- **Install Command:** `npm install zcash-paywall-sdk`
- **Import:** `import { ZcashPaywall } from 'zcash-paywall-sdk'`

## Next Steps

1. **Add badges to README:** NPM version, downloads, license
2. **Set up CI/CD:** Automate testing and publishing
3. **Create examples:** Add more usage examples
4. **Documentation site:** Consider creating a dedicated docs site
5. **Community:** Share on relevant forums and communities

---

🎉 **Congratulations!** Your Zcash Paywall SDK is now published and available for developers worldwide!