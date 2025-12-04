import pool from '../db/db.js';
import validator from 'validator';

async function createProject(projectData) {
  const { user_id, name, description, category, website_url, github_url, logo_url, tags, default_wallet_address } = projectData;
  
  // Validate URLs if provided
  if (website_url && !validator.isURL(website_url)) {
    throw new Error('Invalid website URL');
  }
  if (github_url && !validator.isURL(github_url)) {
    throw new Error('Invalid GitHub URL');
  }
  if (logo_url && !validator.isURL(logo_url)) {
    throw new Error('Invalid logo URL');
  }

  const result = await pool.query(
    `INSERT INTO projects (user_id, name, description, category, website_url, github_url, logo_url, tags, default_wallet_address) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [user_id, name, description, category, website_url, github_url, logo_url, tags, default_wallet_address]
  );
  
  return result.rows[0];
}

async function getAllProjects(userId) {
  const result = await pool.query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function getProjectById(projectId, userId) {
  const result = await pool.query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows[0];
}

async function updateProject(projectId, userId, updateData) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(projectId, userId);
  
  const result = await pool.query(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() 
     WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
    values
  );
  
  return result.rows[0];
}

async function deleteProject(projectId, userId) {
  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *',
    [projectId, userId]
  );
  return result.rows[0];
}

async function searchProjects(searchQuery, userId) {
  const result = await pool.query(
    `SELECT * FROM projects 
     WHERE user_id = $1 AND (
       name ILIKE $2 OR 
       description ILIKE $2 OR 
       $3 = ANY(tags)
     ) ORDER BY created_at DESC`,
    [userId, `%${searchQuery}%`, searchQuery]
  );
  return result.rows;
}

export { 
  createProject, 
  getAllProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  searchProjects 
};
