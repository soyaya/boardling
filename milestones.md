As a senior fullstack blockchain developer, I want to integrate backend for reports and payment (./backend) with my frontend (./). There's also another services (./backend/indexer) for saving the blockchain to the postgres backend. Review the whole codebase write a document for each page and use as context and what the objectives of the platform.
Flow I need to implement
- signup page
-- store full name, email and password
-- verify email by sending a welcome email
- login page
-- login with email and password
- first timer/ uncomplete setup; 
-- continue onboarding; store company name, company sector, company wallet address, company privacy type (monetized - set fee)
--- make subscription; 30 days (can set in db) free for first timers
-- pull wallet data based on metrics as proposed in the codebase architecture: save to db, pull to frontend {Dashboard, Adoption, Analytics, Retention, Productivity, Shielded Pool, Segments, Project Health, Comparison}
--- no Comparison or Search check for privacy type - process payment flow
--- startup dashboard; withdraw flow, profile
