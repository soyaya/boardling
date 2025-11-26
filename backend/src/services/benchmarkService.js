import pool from '../db/db.js';

/**
 * Competitive Benchmarking Service
 * Manages benchmark data storage, percentile calculations, and competitive comparisons
 */

/**
 * Store or update benchmark data for a specific type and category
 * @param {string} benchmarkType - Type of benchmark ('productivity', 'retention', 'adoption', 'churn')
 * @param {string} category - Project category ('defi', 'gamefi', etc.)
 * @param {Object} percentiles - Object containing percentile values
 * @param {number} sampleSize - Number of projects in the sample
 * @param {Date} calculationDate - Date when benchmark was calculated
 */
async function storeBenchmark(benchmarkType, category, percentiles, sampleSize, calculationDate = new Date()) {
  try {
    const calcDate = calculationDate instanceof Date 
      ? calculationDate.toISOString().split('T')[0]
      : calculationDate;

    const result = await pool.query(`
      INSERT INTO competitive_benchmarks (
        benchmark_type,
        category,
        percentile_25,
        percentile_50,
        percentile_75,
        percentile_90,
        sample_size,
        calculation_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (benchmark_type, category, calculation_date)
      DO UPDATE SET
        percentile_25 = EXCLUDED.percentile_25,
        percentile_50 = EXCLUDED.percentile_50,
        percentile_75 = EXCLUDED.percentile_75,
        percentile_90 = EXCLUDED.percentile_90,
        sample_size = EXCLUDED.sample_size
      RETURNING *
    `, [
      benchmarkType,
      category,
      percentiles.p25,
      percentiles.p50,
      percentiles.p75,
      percentiles.p90,
      sampleSize,
      calcDate
    ]);

    return result.rows[0];
  } catch (error) {
    console.error(`Error storing benchmark ${benchmarkType}/${category}:`, error);
    throw error;
  }
}

/**
 * Calculate percentiles from an array of values
 * @param {number[]} values - Array of numeric values
 * @returns {Object} Object containing p25, p50, p75, p90 percentiles
 */
function calculatePercentiles(values) {
  if (!values || values.length === 0) {
    return { p25: 0, p50: 0, p75: 0, p90: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p) => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90)
  };
}

/**
 * Calculate and store benchmarks from project data
 * @param {string} benchmarkType - Type of benchmark to calculate
 * @param {string} category - Project category
 * @param {number[]} values - Array of metric values from projects
 */
async function calculateAndStoreBenchmark(benchmarkType, category, values) {
  try {
    if (!values || values.length === 0) {
      console.warn(`No values provided for ${benchmarkType}/${category} benchmark`);
      return null;
    }

    const percentiles = calculatePercentiles(values);
    const sampleSize = values.length;
    const calculationDate = new Date();

    const benchmark = await storeBenchmark(
      benchmarkType,
      category,
      percentiles,
      sampleSize,
      calculationDate
    );

    console.log(`✅ Calculated benchmark for ${benchmarkType}/${category}: ${sampleSize} samples`);
    return benchmark;
  } catch (error) {
    console.error(`Error calculating benchmark ${benchmarkType}/${category}:`, error);
    throw error;
  }
}

/**
 * Get the latest benchmark for a specific type and category
 * @param {string} benchmarkType - Type of benchmark
 * @param {string} category - Project category
 */
async function getLatestBenchmark(benchmarkType, category) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM competitive_benchmarks
      WHERE benchmark_type = $1 AND category = $2
      ORDER BY calculation_date DESC
      LIMIT 1
    `, [benchmarkType, category]);

    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error getting latest benchmark ${benchmarkType}/${category}:`, error);
    throw error;
  }
}

/**
 * Get all benchmarks for a specific category
 * @param {string} category - Project category
 */
async function getBenchmarksByCategory(category) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (benchmark_type)
        *
      FROM competitive_benchmarks
      WHERE category = $1
      ORDER BY benchmark_type, calculation_date DESC
    `, [category]);

    return result.rows;
  } catch (error) {
    console.error(`Error getting benchmarks for category ${category}:`, error);
    throw error;
  }
}

/**
 * Get benchmark history for a specific type and category
 * @param {string} benchmarkType - Type of benchmark
 * @param {string} category - Project category
 * @param {number} limit - Maximum number of historical records to return
 */
async function getBenchmarkHistory(benchmarkType, category, limit = 30) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM competitive_benchmarks
      WHERE benchmark_type = $1 AND category = $2
      ORDER BY calculation_date DESC
      LIMIT $3
    `, [benchmarkType, category, limit]);

    return result.rows;
  } catch (error) {
    console.error(`Error getting benchmark history ${benchmarkType}/${category}:`, error);
    throw error;
  }
}

/**
 * Get all available benchmark categories
 */
async function getBenchmarkCategories() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category
      FROM competitive_benchmarks
      ORDER BY category
    `);

    return result.rows.map(row => row.category);
  } catch (error) {
    console.error('Error getting benchmark categories:', error);
    throw error;
  }
}

/**
 * Get benchmark statistics summary
 */
async function getBenchmarkStatistics() {
  try {
    const result = await pool.query(`
      SELECT 
        benchmark_type,
        category,
        COUNT(*) as data_points,
        MIN(calculation_date) as earliest_date,
        MAX(calculation_date) as latest_date,
        AVG(sample_size) as avg_sample_size
      FROM competitive_benchmarks
      GROUP BY benchmark_type, category
      ORDER BY benchmark_type, category
    `);

    return result.rows;
  } catch (error) {
    console.error('Error getting benchmark statistics:', error);
    throw error;
  }
}

/**
 * Delete old benchmark data (cleanup)
 * @param {number} daysToKeep - Number of days of data to retain
 */
async function cleanupOldBenchmarks(daysToKeep = 365) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const result = await pool.query(`
      DELETE FROM competitive_benchmarks
      WHERE calculation_date < $1
      RETURNING *
    `, [cutoffDateStr]);

    console.log(`🗑️  Deleted ${result.rowCount} old benchmark records`);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning up old benchmarks:', error);
    throw error;
  }
}

/**
 * Determine which percentile range a value falls into
 * @param {number} value - The value to compare
 * @param {Object} benchmark - Benchmark object with percentile values
 * @returns {string} Percentile range ('below_25', '25_50', '50_75', '75_90', 'above_90')
 */
function getPercentileRange(value, benchmark) {
  if (!benchmark) return 'unknown';

  if (value < benchmark.percentile_25) return 'below_25';
  if (value < benchmark.percentile_50) return '25_50';
  if (value < benchmark.percentile_75) return '50_75';
  if (value < benchmark.percentile_90) return '75_90';
  return 'above_90';
}

/**
 * Calculate performance gap against benchmark
 * @param {number} value - The value to compare
 * @param {Object} benchmark - Benchmark object with percentile values
 * @param {string} targetPercentile - Target percentile ('p50', 'p75', 'p90')
 * @returns {Object} Gap analysis with percentage difference
 */
function calculatePerformanceGap(value, benchmark, targetPercentile = 'p50') {
  if (!benchmark) {
    return { gap: null, percentage: null, status: 'no_benchmark' };
  }

  const percentileMap = {
    p25: benchmark.percentile_25,
    p50: benchmark.percentile_50,
    p75: benchmark.percentile_75,
    p90: benchmark.percentile_90
  };

  const targetValue = percentileMap[targetPercentile];
  if (targetValue === null || targetValue === undefined) {
    return { gap: null, percentage: null, status: 'invalid_target' };
  }

  const gap = value - targetValue;
  const percentage = targetValue !== 0 ? (gap / targetValue) * 100 : 0;

  return {
    gap,
    percentage: Math.round(percentage * 100) / 100,
    status: gap >= 0 ? 'above_target' : 'below_target',
    targetValue,
    currentValue: value
  };
}

export {
  storeBenchmark,
  calculatePercentiles,
  calculateAndStoreBenchmark,
  getLatestBenchmark,
  getBenchmarksByCategory,
  getBenchmarkHistory,
  getBenchmarkCategories,
  getBenchmarkStatistics,
  cleanupOldBenchmarks,
  getPercentileRange,
  calculatePerformanceGap
};
