import pool from '../db/db.js';

/**
 * Cohort Analysis and Retention Tracking Service
 * Manages wallet cohorts and calculates retention metrics
 */

/**
 * Create or update a cohort for a specific time period
 */
async function createOrUpdateCohort(cohortType, cohortPeriod) {
  try {
    const result = await pool.query(`
      INSERT INTO wallet_cohorts (cohort_type, cohort_period, wallet_count)
      VALUES ($1, $2, 0)
      ON CONFLICT (cohort_type, cohort_period) 
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `, [cohortType, cohortPeriod]);

    return result.rows[0];
  } catch (error) {
    console.error(`Error creating/updating cohort ${cohortType} ${cohortPeriod}:`, error);
    throw error;
  }
}

/**
 * Assign a wallet to appropriate cohorts based on creation date
 */
async function assignWalletToCohorts(walletId) {
  try {
    console.log(`Assigning wallet ${walletId} to cohorts...`);

    // Get wallet creation date
    const walletResult = await pool.query(
      'SELECT created_at FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!walletResult.rows[0]) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    const createdAt = new Date(walletResult.rows[0].created_at);
    
    // Calculate cohort periods
    const weeklyPeriod = getWeekStart(createdAt);
    const monthlyPeriod = getMonthStart(createdAt);

    console.log(`Wallet created at: ${createdAt.toISOString()}`);
    console.log(`Weekly cohort period: ${weeklyPeriod}`);
    console.log(`Monthly cohort period: ${monthlyPeriod}`);

    // Create or get weekly cohort
    const weeklyCohort = await createOrUpdateCohort('weekly', weeklyPeriod);
    
    // Create or get monthly cohort
    const monthlyCohort = await createOrUpdateCohort('monthly', monthlyPeriod);

    // Assign wallet to cohorts
    const assignments = [];

    // Weekly assignment
    try {
      const weeklyAssignment = await pool.query(`
        INSERT INTO wallet_cohort_assignments (wallet_id, cohort_id)
        VALUES ($1, $2)
        ON CONFLICT (wallet_id, cohort_id) DO NOTHING
        RETURNING *
      `, [walletId, weeklyCohort.id]);

      if (weeklyAssignment.rows[0]) {
        assignments.push({ type: 'weekly', assignment: weeklyAssignment.rows[0] });
      }
    } catch (error) {
      console.error(`Error assigning wallet to weekly cohort:`, error);
    }

    // Monthly assignment
    try {
      const monthlyAssignment = await pool.query(`
        INSERT INTO wallet_cohort_assignments (wallet_id, cohort_id)
        VALUES ($1, $2)
        ON CONFLICT (wallet_id, cohort_id) DO NOTHING
        RETURNING *
      `, [walletId, monthlyCohort.id]);

      if (monthlyAssignment.rows[0]) {
        assignments.push({ type: 'monthly', assignment: monthlyAssignment.rows[0] });
      }
    } catch (error) {
      console.error(`Error assigning wallet to monthly cohort:`, error);
    }

    // Update cohort wallet counts
    await updateCohortWalletCounts(weeklyCohort.id);
    await updateCohortWalletCounts(monthlyCohort.id);

    console.log(`Successfully assigned wallet ${walletId} to ${assignments.length} cohorts`);
    return assignments;

  } catch (error) {
    console.error(`Error assigning wallet ${walletId} to cohorts:`, error);
    throw error;
  }
}

/**
 * Get the start of the week for a given date (Monday)
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split('T')[0];
}

/**
 * Get the start of the month for a given date
 */
function getMonthStart(date) {
  const d = new Date(date);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  return monthStart.toISOString().split('T')[0];
}

/**
 * Update wallet count for a cohort
 */
async function updateCohortWalletCounts(cohortId) {
  try {
    await pool.query(`
      UPDATE wallet_cohorts 
      SET wallet_count = (
        SELECT COUNT(*) 
        FROM wallet_cohort_assignments 
        WHERE cohort_id = $1
      ),
      updated_at = NOW()
      WHERE id = $1
    `, [cohortId]);
  } catch (error) {
    console.error(`Error updating cohort wallet count for ${cohortId}:`, error);
    throw error;
  }
}

/**
 * Process all unassigned wallets and assign them to cohorts
 */
async function processUnassignedWallets() {
  try {
    console.log('🔄 Processing unassigned wallets for cohort assignment...');

    // Find wallets that are not assigned to any cohorts
    const result = await pool.query(`
      SELECT w.id, w.created_at
      FROM wallets w
      LEFT JOIN wallet_cohort_assignments wca ON w.id = wca.wallet_id
      WHERE wca.wallet_id IS NULL
      AND w.is_active = true
      ORDER BY w.created_at ASC
    `);

    console.log(`Found ${result.rows.length} unassigned wallets`);

    const assignments = [];
    for (const wallet of result.rows) {
      try {
        const walletAssignments = await assignWalletToCohorts(wallet.id);
        assignments.push(...walletAssignments);
      } catch (error) {
        console.error(`Failed to assign wallet ${wallet.id}:`, error.message);
      }
    }

    console.log(`✅ Successfully assigned ${assignments.length} wallet-cohort pairs`);
    return assignments;

  } catch (error) {
    console.error('❌ Error in processUnassignedWallets:', error);
    throw error;
  }
}

/**
 * Create cohorts for a date range and assign existing wallets
 */
async function createCohortsForDateRange(startDate, endDate, cohortType = 'weekly') {
  try {
    console.log(`Creating ${cohortType} cohorts from ${startDate} to ${endDate}...`);

    const cohorts = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      let cohortPeriod;
      
      if (cohortType === 'weekly') {
        cohortPeriod = getWeekStart(current);
        current.setDate(current.getDate() + 7); // Move to next week
      } else if (cohortType === 'monthly') {
        cohortPeriod = getMonthStart(current);
        current.setMonth(current.getMonth() + 1); // Move to next month
      } else {
        throw new Error(`Invalid cohort type: ${cohortType}`);
      }

      // Create cohort
      const cohort = await createOrUpdateCohort(cohortType, cohortPeriod);
      cohorts.push(cohort);

      // Find and assign wallets created in this period
      let periodEnd;
      if (cohortType === 'weekly') {
        const periodEndDate = new Date(cohortPeriod);
        periodEndDate.setDate(periodEndDate.getDate() + 6);
        periodEnd = periodEndDate.toISOString().split('T')[0];
      } else {
        const periodEndDate = new Date(cohortPeriod);
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
        periodEndDate.setDate(0); // Last day of the month
        periodEnd = periodEndDate.toISOString().split('T')[0];
      }

      // Find wallets created in this period
      const walletsResult = await pool.query(`
        SELECT id FROM wallets 
        WHERE DATE(created_at) BETWEEN $1 AND $2
        AND is_active = true
      `, [cohortPeriod, periodEnd]);

      // Assign wallets to this cohort
      for (const wallet of walletsResult.rows) {
        try {
          await pool.query(`
            INSERT INTO wallet_cohort_assignments (wallet_id, cohort_id)
            VALUES ($1, $2)
            ON CONFLICT (wallet_id, cohort_id) DO NOTHING
          `, [wallet.id, cohort.id]);
        } catch (error) {
          console.error(`Error assigning wallet ${wallet.id} to cohort ${cohort.id}:`, error);
        }
      }

      // Update wallet count
      await updateCohortWalletCounts(cohort.id);
    }

    console.log(`✅ Created ${cohorts.length} ${cohortType} cohorts`);
    return cohorts;

  } catch (error) {
    console.error(`Error creating cohorts for date range:`, error);
    throw error;
  }
}

/**
 * Get cohort information with wallet assignments
 */
async function getCohortInfo(cohortId) {
  try {
    const result = await pool.query(`
      SELECT 
        wc.*,
        COUNT(wca.wallet_id) as actual_wallet_count,
        array_agg(wca.wallet_id) as wallet_ids
      FROM wallet_cohorts wc
      LEFT JOIN wallet_cohort_assignments wca ON wc.id = wca.cohort_id
      WHERE wc.id = $1
      GROUP BY wc.id, wc.cohort_type, wc.cohort_period, wc.wallet_count, 
               wc.retention_week_1, wc.retention_week_2, wc.retention_week_3, wc.retention_week_4,
               wc.created_at, wc.updated_at
    `, [cohortId]);

    return result.rows[0];
  } catch (error) {
    console.error(`Error getting cohort info for ${cohortId}:`, error);
    throw error;
  }
}

/**
 * Get all cohorts with basic statistics
 */
async function getAllCohorts(cohortType = null, limit = 50) {
  try {
    let query = `
      SELECT 
        wc.*,
        COUNT(wca.wallet_id) as actual_wallet_count
      FROM wallet_cohorts wc
      LEFT JOIN wallet_cohort_assignments wca ON wc.id = wca.cohort_id
    `;
    
    const params = [];
    if (cohortType) {
      query += ` WHERE wc.cohort_type = $1`;
      params.push(cohortType);
    }
    
    query += `
      GROUP BY wc.id, wc.cohort_type, wc.cohort_period, wc.wallet_count,
               wc.retention_week_1, wc.retention_week_2, wc.retention_week_3, wc.retention_week_4,
               wc.created_at, wc.updated_at
      ORDER BY wc.cohort_period DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting all cohorts:', error);
    throw error;
  }
}

/**
 * Get cohort statistics summary
 */
async function getCohortStatistics() {
  try {
    const result = await pool.query(`
      SELECT 
        cohort_type,
        COUNT(*) as total_cohorts,
        SUM(wallet_count) as total_wallets,
        AVG(wallet_count) as avg_wallets_per_cohort,
        MIN(cohort_period) as earliest_cohort,
        MAX(cohort_period) as latest_cohort
      FROM wallet_cohorts
      GROUP BY cohort_type
      ORDER BY cohort_type
    `);

    return result.rows;
  } catch (error) {
    console.error('Error getting cohort statistics:', error);
    throw error;
  }
}

export {
  createOrUpdateCohort,
  assignWalletToCohorts,
  processUnassignedWallets,
  createCohortsForDateRange,
  getCohortInfo,
  getAllCohorts,
  getCohortStatistics,
  updateCohortWalletCounts,
  getWeekStart,
  getMonthStart
};