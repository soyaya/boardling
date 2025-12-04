# Boardling Platform Overview

## Platform Objectives

Boardling is a **privacy-first Zcash wallet analytics platform** designed for Web3 projects to understand and optimize their user base. The platform provides comprehensive analytics on wallet behavior, transaction patterns, retention metrics, and adoption funnels while respecting user privacy through configurable data sharing controls.

### Core Value Propositions

1. **Privacy-First Analytics**: Three-tier privacy system (private/public/monetizable) puts users in control
2. **Comprehensive Insights**: Track wallet behavior across 9 specialized analytics dashboards
3. **Data Monetization**: Users can earn ZEC by sharing their analytics data with other projects
4. **Zcash-Native**: Built specifically for Zcash's unique privacy features (transparent, shielded, unified addresses)
5. **AI-Powered Recommendations**: Automated insights and alerts based on wallet behavior patterns

### Target Users

- **Web3 Project Founders**: Track user adoption and retention for their Zcash-based applications
- **Product Managers**: Understand user behavior and optimize product features
- **Growth Teams**: Identify churn risks and improve user engagement
- **Researchers**: Access anonymized wallet data for market research (with user consent)

## Platform Architecture

### Three-Tier System

1. **Frontend Application** (`./src`)
   - React/TypeScript SPA
   - Modern UI with TailwindCSS
   - Real-time data visualization
   - Responsive design for mobile and desktop

2. **Backend API** (`./backend`)
   - Node.js/Express REST API
   - PostgreSQL database
   - JWT authentication
   - Comprehensive analytics services
   - Zcash payment processing

3. **Blockchain Indexer** (`./backend/indexer`)
   - Continuous Zcash blockchain synchronization
   - Transaction parsing and storage
   - Wallet activity tracking
   - Real-time data updates

## Page-by-Page Breakdown

### Public Pages (Unauthenticated)

#### Landing Page (`/`)
**Purpose**: Marketing and conversion
- Value proposition and feature highlights
- Pricing information
- Call-to-action for sign up
- Testimonials and social proof

**Key Features**:
- Hero section with platform benefits
- Feature showcase with icons
- Pricing tiers comparison
- Customer testimonials
- Footer with links

#### Sign Up Page (`/signup`)
**Purpose**: User registration and account creation
- Collect user information (name, email, password)
- Email validation
- Password strength requirements
- Terms of service acceptance

**Flow**:
1. User enters name, email, company (optional), password
2. Frontend validates input
3. Backend creates user with hashed password
4. Welcome email sent (future: email verification)
5. Redirect to sign-in page

#### Sign In Page (`/signin`)
**Purpose**: User authentication
- Email and password login
- Remember me option
- Forgot password link
- OAuth options (Google, GitHub)

**Flow**:
1. User enters credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. Redirect based on onboarding status:
   - First-time users → Onboarding
   - Returning users → Dashboard

### Onboarding Flow (`/onboarding`)

**Purpose**: Guide new users through initial setup

#### Step 1: Welcome
- Platform introduction
- Value proposition
- Feature overview
- "Get Started" CTA

#### Step 2: Project Creation
- Company name input
- Company sector selection
- Project description
- Privacy preferences

#### Step 3: Wallet Addition
- Primary wallet address input
- Address validation (t/z/u address)
- Privacy mode selection:
  - **Private**: Data stays private
  - **Public**: Anonymized data in aggregates
  - **Monetizable**: Earn ZEC by sharing data
- Fee configuration (if monetizable)

**Completion**:
- Creates project record
- Creates wallet record
- Initializes 30-day free trial
- Redirects to Dashboard

### Analytics Dashboards (Authenticated)

#### Dashboard (`/dashboard`)
**Purpose**: High-level overview of all wallet metrics

**Displays**:
- Total wallets tracked
- Active wallets (last 30 days)
- Total transaction volume
- Average transaction value
- User growth trend chart
- Top performing wallets table
- Quick actions (Add Wallet, Export Data)

**Data Sources**:
- `wallet_activity_metrics` table
- Aggregated across all user's projects
- Real-time updates from indexer

#### Adoption Page (`/adoption`)
**Purpose**: Track user progression through adoption stages

**Displays**:
- Adoption funnel visualization
- Stage breakdown:
  - Created (wallet exists)
  - First Transaction
  - Feature Usage
  - Recurring User
  - High Value User
- Conversion rates between stages
- Time to achieve each stage
- Drop-off analysis

**Data Sources**:
- `wallet_adoption_stages` table
- Conversion probability calculations
- Time-to-achieve metrics

**Use Cases**:
- Identify where users drop off
- Optimize onboarding flow
- Predict user conversion
- Measure product-market fit

#### Analytics Page (`/analytics`)
**Purpose**: Deep dive into transaction patterns and behavior

**Displays**:
- Transaction history table
- Transaction type breakdown (transfers, swaps, bridges)
- Volume over time chart
- Fee analysis
- Behavior patterns:
  - Transaction frequency
  - Preferred transaction times
  - Average transaction size
  - Complexity scores

**Data Sources**:
- `wallet_activity_metrics` table
- Transaction data from indexer
- Behavior pattern calculations

**Use Cases**:
- Understand user behavior
- Identify power users
- Detect unusual patterns
- Optimize gas fees

#### Retention Page (`/retention`)
**Purpose**: Measure user retention and cohort analysis

**Displays**:
- Cohort heatmap (weekly/monthly)
- Retention curves
- Churn analysis
- Returning user percentage
- Cohort comparison

**Data Sources**:
- `wallet_cohorts` table
- `wallet_cohort_assignments` table
- Retention rate calculations

**Use Cases**:
- Measure product stickiness
- Identify churn risks
- Compare cohort performance
- Validate product changes

#### Productivity Page (`/productivity`)
**Purpose**: Score wallet productivity and track tasks

**Displays**:
- Overall productivity score (0-100)
- Component scores:
  - Retention score
  - Adoption score
  - Activity score
  - Diversity score
- Status indicators (healthy, at-risk, churn)
- Risk level (low, medium, high)
- Pending tasks list
- Completed tasks list

**Data Sources**:
- `wallet_productivity_scores` table
- Multi-factor scoring algorithm
- Task completion tracking

**Use Cases**:
- Identify at-risk users
- Prioritize engagement efforts
- Track user health
- Automate interventions

#### Shielded Pool Page (`/shielded-pool`)
**Purpose**: Analytics specific to shielded transactions

**Displays**:
- Shielded transaction count
- Shielded volume
- Privacy usage percentage
- Shielded vs transparent comparison
- Memo field usage
- Pool migration patterns

**Data Sources**:
- Shielded transaction data from indexer
- `wallet_activity_metrics` (shielded_count)
- Privacy preference analysis

**Use Cases**:
- Measure privacy adoption
- Understand shielded usage
- Optimize privacy features
- Educate users on privacy

#### Segments Page (`/segments`)
**Purpose**: Group wallets by behavior patterns

**Displays**:
- Wallet segments:
  - Power Users
  - Casual Users
  - Dormant Users
  - New Users
  - High Value Users
- Segment characteristics
- Segment size and growth
- Segment-specific metrics

**Data Sources**:
- Clustering algorithms on wallet data
- Behavior pattern analysis
- Activity metrics

**Use Cases**:
- Targeted marketing
- Personalized engagement
- Feature prioritization
- User segmentation strategy

#### Project Health Page (`/project-health`)
**Purpose**: Overall project health and status

**Displays**:
- Health score (0-100)
- Key health indicators:
  - User growth rate
  - Retention rate
  - Transaction volume trend
  - Active user percentage
- Alerts and warnings
- Recommendations
- Trend analysis

**Data Sources**:
- Aggregated metrics across all dashboards
- Health scoring algorithm
- Trend calculations

**Use Cases**:
- Executive dashboard
- Quick health check
- Identify issues early
- Track progress over time

#### Comparison Page (`/comparison`)
**Purpose**: Competitive benchmarking (privacy-gated)

**Displays**:
- Industry benchmarks
- Peer comparison
- Percentile rankings
- Best practices
- Gap analysis

**Access Control**:
- Only available to users with public or monetizable privacy mode
- Requires active subscription
- Data anonymized and aggregated

**Data Sources**:
- Aggregated data from public/monetizable wallets
- Industry benchmarks
- Comparative analytics

**Use Cases**:
- Competitive analysis
- Industry positioning
- Strategic planning
- Performance benchmarking

### Settings & Management

#### Settings Page (`/settings`)
**Purpose**: User profile and account management

**Sections**:

1. **Profile**
   - Name, email, company
   - Avatar upload
   - Account information

2. **Security**
   - Change password
   - Two-factor authentication (future)
   - Active sessions

3. **Subscription**
   - Current plan (Free Trial, Premium, Enterprise)
   - Days remaining
   - Upgrade/downgrade options
   - Billing history

4. **Payment Preferences**
   - Preferred address type (t/z/u)
   - Default wallet
   - Auto-create wallets

5. **Privacy Settings**
   - Default privacy mode
   - Data sharing preferences
   - Monetization settings

6. **Withdrawals**
   - Current balance
   - Withdrawal history
   - Request withdrawal
   - Withdrawal address management

7. **Notifications**
   - Email preferences
   - Alert settings
   - Notification frequency

## User Flows

### New User Flow
1. Land on homepage → Sign Up
2. Complete registration → Email verification (future)
3. Sign In → Onboarding
4. Create project → Add wallet → Set privacy
5. Complete onboarding → Dashboard
6. Explore analytics pages
7. 30-day free trial active

### Returning User Flow
1. Sign In → Dashboard
2. View analytics across pages
3. Add more wallets/projects
4. Manage settings
5. Upgrade subscription (if trial expired)

### Data Monetization Flow
1. Set wallet privacy to "monetizable"
2. Configure fee
3. Other users discover data
4. Purchase access → Payment
5. 70% to data owner, 30% to platform
6. Balance updated
7. Request withdrawal

### Subscription Upgrade Flow
1. Free trial expires
2. Premium features restricted
3. Navigate to Settings → Subscription
4. Select plan → Create invoice
5. Pay with ZEC
6. Subscription activated
7. Full access restored

## Privacy Modes Explained

### Private Mode
- **Data Visibility**: Only visible to wallet owner
- **Use Case**: Maximum privacy, no data sharing
- **Comparison Access**: No
- **Monetization**: No earnings

### Public Mode
- **Data Visibility**: Anonymized in aggregate statistics
- **Use Case**: Contribute to industry benchmarks
- **Comparison Access**: Yes
- **Monetization**: No earnings

### Monetizable Mode
- **Data Visibility**: Available for purchase by other users
- **Use Case**: Earn ZEC by sharing analytics
- **Comparison Access**: Yes
- **Monetization**: 70% of purchase price

## Subscription Tiers

### Free Trial (30 days)
- All features unlocked
- Up to 5 wallets
- Basic support
- Automatic for new users

### Premium ($29/month in ZEC)
- Unlimited wallets
- All analytics dashboards
- Priority support
- API access
- Export data

### Enterprise (Custom pricing)
- White-label option
- Dedicated support
- Custom integrations
- SLA guarantees
- Team collaboration

## Technical Implementation Notes

### Authentication
- JWT tokens with 1-hour expiration
- Refresh tokens for extended sessions
- Secure password hashing with bcrypt
- OAuth integration (future)

### Data Privacy
- Privacy mode enforced at query level
- Immediate enforcement on mode change
- Anonymization for public data
- No PII in monetizable data

### Performance
- 5-minute cache TTL for analytics
- 85%+ cache hit rate target
- Batch processing for large datasets
- Indexed database queries

### Blockchain Integration
- Real-time transaction tracking
- Support for t/z/u addresses
- Zaino indexer for shielded data
- Automatic wallet type detection

## Future Enhancements

1. **Email Verification**: Verify email addresses on registration
2. **Two-Factor Authentication**: Enhanced security
3. **Team Collaboration**: Multi-user projects
4. **API Access**: Programmatic data access
5. **Webhooks**: Real-time notifications
6. **Mobile App**: iOS and Android apps
7. **Advanced AI**: Predictive analytics and recommendations
8. **Multi-Chain Support**: Expand beyond Zcash
9. **White-Label**: Custom branding for enterprise
10. **Advanced Visualizations**: More chart types and customization

## Success Metrics

### Platform Health
- User registration rate
- Onboarding completion rate
- Free trial to paid conversion
- Monthly active users
- Churn rate

### User Engagement
- Average session duration
- Pages per session
- Feature adoption rate
- Data export frequency
- API usage

### Revenue
- Monthly recurring revenue (MRR)
- Average revenue per user (ARPU)
- Data monetization volume
- Withdrawal processing volume
- Platform fee revenue

## Conclusion

Boardling provides a comprehensive, privacy-first analytics platform for Zcash projects. By combining real-time blockchain data with sophisticated analytics and user-controlled privacy, it enables projects to understand and optimize their user base while respecting individual privacy preferences.

The platform's unique data monetization model creates a win-win scenario where users can earn ZEC by sharing their analytics while projects gain valuable competitive insights. With a 30-day free trial and flexible subscription options, Boardling makes advanced wallet analytics accessible to projects of all sizes.
