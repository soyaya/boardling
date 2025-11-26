// Mock database for testing purposes
let users = [];
let projects = [];

const mockPool = {
  async query(text, params) {
    console.log('Mock DB Query:', text, params);
    
    // Handle user queries
    if (text.includes('INSERT INTO users')) {
      const [name, email, password_hash] = params;
      const user = {
        id: `user-${Date.now()}`,
        name,
        email,
        password_hash,
        created_at: new Date(),
        updated_at: new Date()
      };
      users.push(user);
      return { rows: [user] };
    }
    
    if (text.includes('SELECT * FROM users WHERE email')) {
      const [email] = params;
      const user = users.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }
    
    if (text.includes('UPDATE users SET password_hash')) {
      const [password_hash, userId] = params;
      const user = users.find(u => u.id === userId);
      if (user) {
        user.password_hash = password_hash;
        user.updated_at = new Date();
        return { rows: [user] };
      }
      return { rows: [] };
    }
    
    // Handle project queries
    if (text.includes('INSERT INTO projects')) {
      const [user_id, name, description, category, website_url, github_url, logo_url, tags] = params;
      const project = {
        id: `project-${Date.now()}`,
        user_id,
        name,
        description,
        category,
        website_url,
        github_url,
        logo_url,
        tags,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      };
      projects.push(project);
      return { rows: [project] };
    }
    
    if (text.includes('SELECT * FROM projects WHERE user_id')) {
      const [userId] = params;
      const userProjects = projects.filter(p => p.user_id === userId);
      return { rows: userProjects };
    }
    
    if (text.includes('SELECT * FROM projects WHERE id') && text.includes('AND user_id')) {
      const [projectId, userId] = params;
      const project = projects.find(p => p.id === projectId && p.user_id === userId);
      return { rows: project ? [project] : [] };
    }
    
    if (text.includes('UPDATE projects SET')) {
      // Parse the update query to extract field updates
      const projectId = params[params.length - 2];
      const userId = params[params.length - 1];
      const project = projects.find(p => p.id === projectId && p.user_id === userId);
      if (project) {
        // Extract field names from the query
        const updateFields = text.match(/SET\s+(.+?)\s+WHERE/i);
        if (updateFields) {
          const fields = updateFields[1].split(',').map(f => f.trim());
          let paramIndex = 0;
          
          fields.forEach(field => {
            if (field.includes('updated_at')) return; // Skip updated_at
            const fieldName = field.split('=')[0].trim();
            if (params[paramIndex] !== undefined) {
              project[fieldName] = params[paramIndex];
              paramIndex++;
            }
          });
        }
        project.updated_at = new Date();
        return { rows: [project] };
      }
      return { rows: [] };
    }
    
    if (text.includes('DELETE FROM projects WHERE id')) {
      const [projectId, userId] = params;
      const projectIndex = projects.findIndex(p => p.id === projectId && p.user_id === userId);
      if (projectIndex !== -1) {
        const deletedProject = projects.splice(projectIndex, 1)[0];
        return { rows: [deletedProject] };
      }
      return { rows: [] };
    }
    
    // Default response
    return { rows: [] };
  }
};

export default mockPool;