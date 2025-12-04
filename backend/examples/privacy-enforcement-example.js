/**
 * Privacy Enforcement Service - Usage Examples
 * 
 * Demonstrates how to integrate privacy enforcement into analytics endpoints.
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import PrivacyEnforcementService from '../src/services/privacyEnforcementService.js';
import pool from '../src/db/db.js';

const privacyService = new PrivacyEnforcementService(pool);

/**
 * Example 1: Filter wallets by privacy mode in analytics query
 * Requirement 8.1: Private mode data exclusion
 */
async function exampleFilterPrivateWallets(projectId, userId) {
  console.log('\n=== Example 1: Filter Private Wallets ===');
  
  // Get all wallets for the project
  const walletsResult = await pool.query(
    'SELECT id, privacy_mode FROM wallets WHERE project_id = $1',
    [projectId]
  );
  
  const allWalletIds = walletsResult.rows.map(w => w.id);
  console.log(`Total wallets: ${allWalletIds.length}`);
  
  // Filter to only public and monetizable wallets
  const publicWalletIds = await privacyService.filterWalletsByPrivacy(
    allWalletIds,
    ['public', 'monetizable']
  );
  
  console.log(`Public/Monetizable wallets: ${publicWalletIds.length}`);
  console.log(`Private wallets excluded: ${allWalletIds.length - publicWalletIds.length}`);
  
  // Now query analytics only for public wallets
  const analytics = await pool.query(
    `SELECT 
      wallet_id,
      SUM(transaction_count) as total_transactions,
      COUNT(DISTINCT activity_date) as active_days
     FROM wallet_activity_metrics
     WHERE wallet_id = ANY($1)
     GROUP BY wallet_id`,
    [publicWalletIds]
  );
  
  return analytics.rows;
}

/**
 * Example 2: Anonymize wallet data for public display
 * Requirement 8.2: Public mode anonymization
 */
async function exampleAnonymizePublicData(walletId) {
  console.log('\n=== Example 2: Anonymize Public Data ===');
  
  // Check privacy mode
  const privacyMode = await privacyService.checkPrivacyMode(walletId);
  console.log(`Wallet privacy mode: ${privacyMode}`);
  
  if (privacyMode === 'private') {
    throw new Error('Cannot display private wallet data');
  }
  
  // Get wallet analytics
  const analyticsResult = await pool.query(
    `SELECT 
      w.id,
      w.address,
      w.type,
      w.project_id,
      COUNT(DISTINCT wam.activity_date) as active_days,
      SUM(wam.transaction_count) as transaction_count,
      SUM(wam.total_volume_zatoshi) as total_volume,
      AVG(wps.total_score) as avg_productivity_score
     FROM wallets w
     LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
     LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
     WHERE w.id = $1
     GROUP BY w.id, w.address, w.type, w.project_id`,
    [walletId]
  );
  
  const rawData = analyticsResult.rows[0];
  console.log('Raw data includes:', Object.keys(rawData));
  
  // Anonymize the data
  const anonymized = privacyService.anonymizeWalletData(rawData);
  console.log('Anonymized data includes:', Object.keys(anonymized));
  console.log('Identifying info removed:', !anonymized.id && !anonymized.address);
  
  return anonymized;
}

/**
 * Example 3: Check monetizable access before displaying data
 * Requirement 8.3: Monetizable data access control
 */
async function exampleCheckMonetizableAccess(walletId, requesterId) {
  console.log('\n=== Example 3: Check Monetizable Access ===');
  
  // Check if requester can access the wallet data
  const access = await privacyService.checkMonetizableAccess(walletId, requesterId);
  
  console.log('Access decision:', {
    allowed: access.allowed,
    reason: access.reason,
    requiresPayment: access.requiresPayment,
    dataLevel: access.dataLevel
  });
  
  if (!access.allowed) {
    if (access.requiresPayment) {
      // Return payment prompt
      return {
        error: 'Payment required',
        message: 'This wallet data is monetizable. Please purchase access to view.',
        walletId: walletId,
        requiresPayment: true
      };
    } else {
      // Access denied
      return {
        error: 'Access denied',
        message: access.reason
      };
    }
  }
  
  // Access granted - get data at appropriate level
  const analyticsResult = await pool.query(
    `SELECT * FROM wallet_activity_metrics WHERE wallet_id = $1`,
    [walletId]
  );
  
  if (access.dataLevel === 'full') {
    console.log('Returning full data (owner access)');
    return analyticsResult.rows;
  } else {
    console.log('Returning anonymized data (paid/public access)');
    return privacyService.anonymizeWalletDataBatch(analyticsResult.rows);
  }
}

/**
 * Example 4: Update privacy mode with immediate enforcement
 * Requirement 8.4: Immediate privacy mode updates
 */
async function exampleUpdatePrivacyMode(walletId, newMode, userId) {
  console.log('\n=== Example 4: Update Privacy Mode ===');
  
  // Get current mode
  const currentMode = await privacyService.checkPrivacyMode(walletId);
  console.log(`Current privacy mode: ${currentMode}`);
  
  // Validate transition
  const validation = privacyService.validatePrivacyTransition(currentMode, newMode);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }
  
  if (validation.requiresSetup) {
    console.log('Warning:', validation.message);
  }
  
  // Update privacy mode
  const updated = await privacyService.updatePrivacyMode(walletId, newMode, userId);
  console.log(`Privacy mode updated to: ${updated.privacy_mode}`);
  
  // Verify immediate enforcement
  const verifyMode = await privacyService.checkPrivacyMode(walletId);
  console.log(`Verified new mode: ${verifyMode}`);
  console.log(`Immediate enforcement: ${verifyMode === newMode}`);
  
  // Get audit log
  const auditLog = await privacyService.getPrivacyAuditLog(walletId, 5);
  console.log(`Audit log entries: ${auditLog.length}`);
  
  return updated;
}

/**
 * Example 5: Batch update privacy mode for project
 */
async function exampleBatchUpdatePrivacy(projectId, newMode, userId) {
  console.log('\n=== Example 5: Batch Update Privacy Mode ===');
  
  // Get all wallets for project
  const walletsResult = await pool.query(
    'SELECT id FROM wallets WHERE project_id = $1',
    [projectId]
  );
  
  const walletIds = walletsResult.rows.map(w => w.id);
  console.log(`Updating ${walletIds.length} wallets to ${newMode} mode`);
  
  // Batch update
  const updated = await privacyService.batchUpdatePrivacyMode(
    walletIds,
    newMode,
    userId
  );
  
  console.log(`Successfully updated ${updated.length} wallets`);
  
  // Verify all updated
  const allUpdated = updated.every(w => w.privacy_mode === newMode);
  console.log(`All wallets updated: ${allUpdated}`);
  
  return updated;
}

/**
 * Example 6: Get privacy statistics for dashboard
 */
async function exampleGetPrivacyStats(projectId) {
  console.log('\n=== Example 6: Privacy Statistics ===');
  
  const stats = await privacyService.getPrivacyStats(projectId);
  
  console.log('Privacy mode distribution:');
  console.log(`  Private: ${stats.private} (${(stats.private / stats.total * 100).toFixed(1)}%)`);
  console.log(`  Public: ${stats.public} (${(stats.public / stats.total * 100).toFixed(1)}%)`);
  console.log(`  Monetizable: ${stats.monetizable} (${(stats.monetizable / stats.total * 100).toFixed(1)}%)`);
  console.log(`  Total: ${stats.total}`);
  
  return stats;
}

/**
 * Example 7: Privacy-aware analytics endpoint
 */
async function examplePrivacyAwareEndpoint(req, res) {
  console.log('\n=== Example 7: Privacy-Aware Analytics Endpoint ===');
  
  const { projectId } = req.params;
  const userId = req.user.id;
  
  try {
    // Get project wallets
    const walletsResult = await pool.query(
      `SELECT w.id, w.privacy_mode, p.user_id as owner_id
       FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.project_id = $1`,
      [projectId]
    );
    
    const wallets = walletsResult.rows;
    const isOwner = wallets.length > 0 && wallets[0].owner_id === userId;
    
    console.log(`User is owner: ${isOwner}`);
    
    // Separate wallets by privacy mode
    const privateWallets = wallets.filter(w => w.privacy_mode === 'private');
    const publicWallets = wallets.filter(w => w.privacy_mode !== 'private');
    
    console.log(`Private wallets: ${privateWallets.length}`);
    console.log(`Public/Monetizable wallets: ${publicWallets.length}`);
    
    // Owner sees all data, non-owner sees only public data
    const visibleWalletIds = isOwner 
      ? wallets.map(w => w.id)
      : publicWallets.map(w => w.id);
    
    console.log(`Visible wallets: ${visibleWalletIds.length}`);
    
    // Get analytics for visible wallets
    const analytics = await pool.query(
      `SELECT 
        wallet_id,
        SUM(transaction_count) as total_transactions,
        COUNT(DISTINCT activity_date) as active_days,
        AVG(sequence_complexity_score) as avg_complexity
       FROM wallet_activity_metrics
       WHERE wallet_id = ANY($1)
       GROUP BY wallet_id`,
      [visibleWalletIds]
    );
    
    // Anonymize data for non-owners
    const data = isOwner 
      ? analytics.rows
      : privacyService.anonymizeWalletDataBatch(analytics.rows);
    
    console.log(`Returning ${data.length} wallet analytics`);
    console.log(`Data anonymized: ${!isOwner}`);
    
    return res.json({
      success: true,
      data: data,
      privacy: {
        isOwner: isOwner,
        anonymized: !isOwner,
        totalWallets: wallets.length,
        visibleWallets: visibleWalletIds.length
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Example 8: Comparison endpoint with privacy gate
 */
async function exampleComparisonEndpoint(req, res) {
  console.log('\n=== Example 8: Privacy-Gated Comparison Endpoint ===');
  
  const { projectId } = req.params;
  const userId = req.user.id;
  
  try {
    // Get user's wallets
    const userWalletsResult = await pool.query(
      `SELECT w.id, w.privacy_mode
       FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );
    
    const userWallets = userWalletsResult.rows;
    console.log(`User has ${userWallets.length} wallets`);
    
    // Check if user has any public or monetizable wallets
    const publicWallets = userWallets.filter(
      w => w.privacy_mode === 'public' || w.privacy_mode === 'monetizable'
    );
    
    console.log(`User has ${publicWallets.length} public/monetizable wallets`);
    
    if (publicWallets.length === 0) {
      console.log('Access denied: No public wallets');
      return res.status(403).json({
        error: 'Access denied',
        message: 'You must have at least one public or monetizable wallet to access comparison data',
        requirement: 'Set at least one wallet to public or monetizable mode'
      });
    }
    
    console.log('Access granted: User has public data');
    
    // Get comparison data (only from public/monetizable wallets)
    const comparisonResult = await pool.query(
      `SELECT 
        w.type as wallet_type,
        AVG(wam.transaction_count) as avg_transactions,
        AVG(wps.total_score) as avg_productivity
       FROM wallets w
       LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
       LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
       WHERE w.privacy_mode IN ('public', 'monetizable')
       GROUP BY w.type`,
      []
    );
    
    console.log(`Returning comparison data for ${comparisonResult.rows.length} wallet types`);
    
    return res.json({
      success: true,
      data: comparisonResult.rows,
      note: 'Comparison data includes only public and monetizable wallets'
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Export examples
export {
  exampleFilterPrivateWallets,
  exampleAnonymizePublicData,
  exampleCheckMonetizableAccess,
  exampleUpdatePrivacyMode,
  exampleBatchUpdatePrivacy,
  exampleGetPrivacyStats,
  examplePrivacyAwareEndpoint,
  exampleComparisonEndpoint
};

// If run directly, show example output
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Privacy Enforcement Service - Usage Examples');
  console.log('='.repeat(60));
  console.log('\nThese examples demonstrate how to integrate privacy enforcement');
  console.log('into your analytics endpoints and services.');
  console.log('\nKey Features:');
  console.log('  ✓ Filter private wallets from queries (Req 8.1)');
  console.log('  ✓ Anonymize data for public display (Req 8.2)');
  console.log('  ✓ Control monetizable data access (Req 8.3)');
  console.log('  ✓ Immediate privacy mode updates (Req 8.4)');
  console.log('\nSee the code above for detailed implementation examples.');
}
