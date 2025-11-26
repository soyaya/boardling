# Frontend-Backend Integration Guide

## Current Status

### Backend (Port 3001)
✅ **Running and functional**
- Express.js server on port 3001
- Comprehensive wallet analytics API
- Routes available:
  - `/api/projects/:projectId/dashboard` - Full dashboard data
  - `/api/projects/:projectId/analytics` - Analytics summary
  - `/api/projects/:projectId/analytics/cohorts` - Cohort retention
  - `/api/projects/:projectId/analytics/adoption-funnel` - Adoption funnel
  - `/api/wallets/:walletId/privacy` - Privacy controls
  - `/api/marketplace/wallets` - Monetiz