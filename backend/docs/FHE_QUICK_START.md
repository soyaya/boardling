# FHE Quick Start Guide

## 5-Minute Setup

### 1. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment

Add to `backend/.env`:

```bash
ENABLE_FHE_ENCRYPTION=true
FHE_ENCRYPTION_KEY=<your_generated_key_here>
```

### 3. Test FHE Service

```bash
node backend/tests/test-fhe-simple.js
```

Expected output:
```
✓ All tests passed!
FHE encryption is working correctly.
```

### 4. Check API Status

```bash
curl http://localhost:3001/api/fhe/status \
  -H "Authorization: Bearer <your_token>"
```

## Usage in Code

### Encrypt Wallet Data

```javascript
import { encryptWalletData, getEncryptionKey } from './services/fheService.js';

const key = getEncryptionKey();
const wallet = {
  address: 'zt1abc123',
  balance: 10.5,
  note: 'My wallet'
};

const encrypted = encryptWalletData(wallet, key);
// Store encrypted in database
```

### Decrypt Wallet Data

```javascript
import { decryptWalletData, getEncryptionKey } from './services/fheService.js';

const key = getEncryptionKey();
const encrypted = await db.query('SELECT * FROM wallets WHERE id = $1', [id]);

const decrypted = decryptWalletData(encrypted.rows[0], key);
// Use decrypted data
```

### Use Middleware (Automatic)

```javascript
import { encryptRequestData, decryptResponseData } from './middleware/fheEncryption.js';

// Encrypt before storing
router.post('/wallets', 
  authenticateToken,
  encryptRequestData({ fields: ['address', 'balance'] }),
  createWallet
);

// Decrypt before sending
router.get('/wallets/:id',
  authenticateToken,
  decryptResponseData(),
  getWallet
);
```

## API Endpoints

### Get FHE Status
```bash
GET /api/fhe/status
Authorization: Bearer <token>
```

### Generate New Key (Admin)
```bash
POST /api/fhe/generate-key
Authorization: Bearer <admin_token>
```

### List Encrypted Fields
```bash
GET /api/fhe/encrypted-fields
Authorization: Bearer <token>
```

## Encrypted Fields

| Data Type | Encrypted Fields |
|-----------|-----------------|
| Wallets | address, balance, note |
| Transactions | amount, from_address, to_address, memo |
| Analytics | wallet_address, transaction_amount, balance, user_id, project_id |

## Security Best Practices

1. **Never commit keys to git**
   ```bash
   # Add to .gitignore
   .env
   *.key
   ```

2. **Use secure key storage in production**
   - AWS KMS
   - HashiCorp Vault
   - Azure Key Vault

3. **Rotate keys periodically**
   ```bash
   # Generate new key
   NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   
   # Migrate data to new key
   # Update environment
   ```

4. **Monitor encryption operations**
   ```javascript
   // Log encryption events
   console.log('Encrypted wallet data for user:', userId);
   ```

## Troubleshooting

### "Decryption failed"
- Check `FHE_ENCRYPTION_KEY` is correct
- Verify data wasn't corrupted
- Ensure key hasn't changed

### "FHE not enabled"
- Set `ENABLE_FHE_ENCRYPTION=true` in `.env`
- Restart server

### Slow performance
- Reduce number of encrypted fields
- Use batch operations
- Implement caching

## Next Steps

1. ✓ Setup complete
2. Enable FHE in production
3. Migrate existing data
4. Monitor performance
5. Plan for true FHE (TFHE/SEAL)

## Resources

- [Full Documentation](./FHE_IMPLEMENTATION.md)
- [Integration Guide](../../FHE_INTEGRATION_COMPLETE.md)
- [Privacy Enforcement](./PRIVACY_ENFORCEMENT_SERVICE.md)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review test output
3. Verify configuration
4. Check server logs
