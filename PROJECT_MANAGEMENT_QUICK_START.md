# Project Management - Quick Start

## What Was Added

A complete **Projects** page where users can manage their analytics projects.

## Access

### Option 1: Sidebar
Click **"Projects"** in the sidebar (second item, below Dashboard)

### Option 2: Project Selector
Click the project name at bottom of sidebar → Click **"Manage Projects"**

## Features

### View Projects
- Grid layout with project cards
- Shows name, category, description, status
- External links (website, GitHub)
- Tags

### Create Project
1. Click **"New Project"** button
2. Fill in form:
   - Name (required)
   - Description
   - Category (required)
   - Website URL
   - GitHub URL
   - Tags
3. Click **"Create Project"**

### Edit Project
1. Click **Edit icon** (pencil) on project card
2. Modify fields
3. Click **"Save Changes"**

### Delete Project
1. Click **Delete icon** (trash) on project card
2. Confirm deletion
3. Project removed

### Select Project
1. Click **"Select"** button on project card
2. Project becomes current
3. Navigates to Dashboard
4. All analytics use this project

## Screenshots

### Projects Grid
```
┌─────────────────────────────────────────────────┐
│ Projects                    [+ New Project]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Project 1│  │ Project 2│  │ Project 3│     │
│  │ DeFi     │  │ NFT      │  │ GameFi   │     │
│  │ [Active] │  │ [Draft]  │  │ [Paused] │     │
│  │          │  │          │  │          │     │
│  │ [Select] │  │ [Select] │  │ [Select] │     │
│  │ [Edit]   │  │ [Edit]   │  │ [Edit]   │     │
│  │ [Delete] │  │ [Delete] │  │ [Delete] │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────┐
│ Projects                    [+ New Project]     │
├─────────────────────────────────────────────────┤
│                                                 │
│              ┌───────────┐                      │
│              │     +     │                      │
│              └───────────┘                      │
│                                                 │
│           No Projects Yet                       │
│                                                 │
│   Create your first project to start           │
│   tracking wallet analytics and insights.      │
│                                                 │
│      [Create Your First Project]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Navigation Flow

```
Sidebar "Projects"
  ↓
Projects Page
  ↓
[New Project] → Create Modal → Project Created
  ↓
[Edit] → Edit Modal → Project Updated
  ↓
[Delete] → Confirm Modal → Project Deleted
  ↓
[Select] → Set as Current → Navigate to Dashboard
```

## Integration

### With Sidebar
- Projects menu item added
- "Manage Projects" link in project selector
- Selected project shows in selector

### With Analytics
- Selecting project sets it as current
- All analytics pages use selected project
- Dashboard shows data for selected project

### With Store
- Uses Zustand project store
- Real-time updates
- Cached data

## Quick Test

```bash
# 1. Open app
http://localhost:5173

# 2. Sign in

# 3. Click "Projects" in sidebar

# 4. Click "New Project"

# 5. Fill form:
Name: Test Project
Category: defi

# 6. Click "Create Project"

# 7. See project card appear

# 8. Click "Select" on project

# 9. Navigate to Dashboard

# 10. See analytics for project
```

## Common Actions

### Create First Project
```
Projects → New Project → Fill Form → Create
```

### Switch Projects
```
Sidebar Project Selector → Select Different Project
```

### Edit Project Details
```
Projects → Edit Icon → Modify → Save
```

### Delete Old Project
```
Projects → Delete Icon → Confirm
```

## Tips

- **Use descriptive names** - Makes projects easy to identify
- **Add tags** - Helps organize projects
- **Set website/GitHub** - Quick access to project resources
- **Update status** - Keep track of project state (active, paused, draft)
- **Select before viewing analytics** - Ensures correct data

## Troubleshooting

### Can't see Projects menu
- Hard refresh browser (Ctrl+Shift+R)
- Check if logged in

### Can't create project
- Check all required fields filled
- Verify URLs are valid format
- Check browser console for errors

### Projects not loading
- Refresh page
- Check backend is running
- Verify authentication

## Next Steps

1. ✅ Create your projects
2. ✅ Add wallets to projects
3. ✅ View analytics
4. ✅ Switch between projects as needed

---

**You can now fully manage your projects!**

Access via: **Sidebar → Projects** or **Project Selector → Manage Projects**
