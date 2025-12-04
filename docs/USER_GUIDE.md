# Boardling User Guide

## Welcome to Boardling

Boardling is a privacy-first Zcash wallet analytics platform that helps Web3 projects understand and optimize their user base. This guide will walk you through all features and help you get the most out of the platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Onboarding](#onboarding)
4. [Project Management](#project-management)
5. [Wallet Management](#wallet-management)
6. [Analytics Dashboards](#analytics-dashboards)
7. [Privacy Controls](#privacy-controls)
8. [Subscription Management](#subscription-management)
9. [Payment & Withdrawals](#payment--withdrawals)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. **Visit the Sign Up Page**
   - Navigate to `https://boardling.com/signup`
   - Or click "Sign Up" from the homepage

2. **Enter Your Information**
   - **Name**: Your full name
   - **Email**: Valid email address (you'll use this to log in)
   - **Password**: Minimum 8 characters, include letters and numbers
   - **Company** (optional): Your organization name

3. **Submit Registration**
   - Click "Create Account"
   - You'll be redirected to the sign-in page
   - Check your email for a welcome message

### Signing In

1. **Navigate to Sign In**
   - Go to `https://boardling.com/signin`
   - Or click "Sign In" from the homepage

2. **Enter Credentials**
   - Email address
   - Password

3. **Access Your Dashboard**
   - First-time users: Redirected to onboarding
   - Returning users: Redirected to dashboard

---

## Account Management

### Viewing Your Profile

1. Click your avatar in the top-right corner
2. Select "Settings"
3. View your profile information in the "Profile" tab

### Updating Profile Information

1. Navigate to Settings → Profile
2. Update any of the following:
   - Name
   - Company name
   - Email address (requires verification)
3. Click "Save Changes"

### Changing Your Password

1. Navigate to Settings → Security
2. Enter your current password
3. Enter your new password (minimum 8 characters)
4. Confirm new password
5. Click "Change Password"

**Security Tips**:
- Use a unique password
- Include uppercase, lowercase, numbers, and symbols
- Don't reuse passwords from other sites
- Consider using a password manager

---

## Onboarding

New users go through a guided onboarding process to set up their first project.

### Step 1: Welcome

- Learn about Boardling's features
- Understand the value proposition
- Click "Get Started" to continue

### Step 2: Create Your Project

1. **Project Name**: Enter a descriptive name (e.g., "My DeFi App")
2. **Company Sector**: Select your industry
   - DeFi
   - Social-Fi
   - GameFi
   - NFT
   - Infrastructure
   - Other
3. **Description** (optional): Brief project description
4. Click "Continue"

### Step 3: Add Your First Wallet

1. **Wallet Address**: Enter a Zcash address to track
   - Transparent (t-address): Starts with `t1`
   - Shielded (z-address): Starts with `zs1`
   - Unified (u-address): Starts with `u1`

2. **Privacy Mode**: Choose how to share your data
   - **Private**: Keep all data private (recommended for start)
   - **Public**: Share anonymized data in aggregates
   - **Monetizable**: Earn ZEC by sharing your data

3. **Description** (optional): Label for this wallet

4. Click "Complete Setup"

### Completion

- Your project and wallet are created
- 30-day free trial automatically activated
- Redirected to your dashboard
- Blockchain indexer begins tracking your wallet

---

## Project Management

### Creating Additional Projects

1. Click "Projects" in the sidebar
2. Click "+ New Project"
3. Fill in project details:
   - Name
   - Description
   - Category
   - Website URL (optional)
   - GitHub URL (optional)
4. Click "Create Project"

### Viewing Projects

1. Navigate to "Projects" page
2. See all your projects with:
   - Project name and status
   - Number of wallets tracked
   - Total transaction volume
   - Active wallets count
   - Creation date

### Switching Between Projects

1. Click the project dropdown in the top navigation
2. Select the project you want to view
3. All analytics will update to show that project's data

### Editing Projects

1. Navigate to Projects page
2. Click the project you want to edit
3. Click "Edit" button
4. Update information
5. Click "Save Changes"

### Deleting Projects

⚠️ **Warning**: This action cannot be undone!

1. Navigate to Projects page
2. Click the project you want to delete
3. Click "Delete Project"
4. Confirm deletion
5. All associated wallets and data will be removed

---

## Wallet Management

### Adding Wallets

1. Navigate to your project
2. Click "Add Wallet" button
3. Enter wallet information:
   - **Address**: Valid Zcash address
   - **Privacy Mode**: private/public/monetizable
   - **Description**: Optional label
4. Click "Add Wallet"

**Address Validation**:
- System automatically detects wallet type (t/z/u)
- Invalid addresses are rejected
- Network (mainnet/testnet) is verified

### Viewing Wallet Details

1. Navigate to Wallets page
2. Click on a wallet to see:
   - Address and type
   - Privacy mode
   - Transaction count
   - Total volume
   - Last activity date
   - Current analytics status

### Updating Privacy Mode

You can change privacy mode at any time:

1. Navigate to wallet details
2. Click "Edit Privacy Mode"
3. Select new mode:
   - **Private**: Stop sharing data
   - **Public**: Share anonymized data
   - **Monetizable**: Enable data sales
4. Click "Update"

**Note**: Changes take effect immediately across all analytics.

### Removing Wallets

1. Navigate to wallet details
2. Click "Remove Wallet"
3. Confirm removal
4. Historical data is preserved but wallet stops being tracked

---

## Analytics Dashboards

### Dashboard Overview

Your main dashboard shows high-level metrics:

**Key Metrics**:
- Total wallets tracked
- Active wallets (last 30 days)
- Total transaction volume
- Average transaction value
- User growth trend

**Quick Actions**:
- Add new wallet
- Export data
- View detailed analytics

### Adoption Analytics

Track how users progress through adoption stages:

**Adoption Funnel**:
1. **Created**: Wallet exists
2. **First Transaction**: Made first transaction
3. **Feature Usage**: Used key features
4. **Recurring**: Regular activity
5. **High Value**: Significant transactions

**Insights**:
- Conversion rates between stages
- Average time to reach each stage
- Drop-off points
- Recommendations for improvement

**Use Cases**:
- Identify onboarding friction
- Optimize user journey
- Predict user conversion
- Measure product-market fit

### Transaction Analytics

Deep dive into transaction patterns:

**Data Displayed**:
- Transaction history table
- Transaction type breakdown
- Volume over time chart
- Fee analysis
- Behavior patterns

**Filters**:
- Date range
- Transaction type
- Wallet address
- Amount range

**Insights**:
- Peak transaction times
- Average transaction size
- Transaction frequency
- Complexity scores

### Retention Analytics

Measure user retention with cohort analysis:

**Cohort Heatmap**:
- Weekly or monthly cohorts
- Retention rates over time
- Color-coded visualization
- Cohort comparison

**Metrics**:
- Week 1, 2, 3, 4 retention
- Churn rate
- Returning user percentage
- Cohort size

**Use Cases**:
- Measure product stickiness
- Identify churn risks
- Compare cohort performance
- Validate product changes

### Productivity Scoring

Understand wallet health and productivity:

**Productivity Score** (0-100):
- **Retention Score**: Activity consistency
- **Adoption Score**: Feature usage
- **Activity Score**: Transaction frequency
- **Diversity Score**: Transaction variety

**Status Indicators**:
- 🟢 **Healthy**: Score 70-100
- 🟡 **At Risk**: Score 40-69
- 🔴 **Churn**: Score 0-39

**Risk Levels**:
- Low: Engaged users
- Medium: Declining activity
- High: Likely to churn

**Tasks**:
- Pending: Actions to improve score
- Completed: Achieved milestones

### Shielded Pool Analytics

Analyze privacy-focused transactions:

**Metrics**:
- Shielded transaction count
- Shielded volume
- Privacy usage rate
- Shielded vs transparent comparison

**Insights**:
- Privacy adoption trends
- Memo field usage
- Pool migration patterns
- Privacy preferences

**Use Cases**:
- Measure privacy features
- Educate users on privacy
- Optimize shielded UX
- Track privacy adoption

### Wallet Segmentation

Group wallets by behavior patterns:

**Segments**:
- **Power Users**: High activity, high value
- **Casual Users**: Moderate activity
- **Dormant Users**: Inactive
- **New Users**: Recently created
- **High Value**: Large transactions

**Segment Details**:
- Size and growth
- Average metrics
- Characteristics
- Trends

**Use Cases**:
- Targeted marketing
- Personalized engagement
- Feature prioritization
- User segmentation strategy

### Project Health

Overall project health indicators:

**Health Score** (0-100):
- User growth rate
- Retention rate
- Transaction volume trend
- Active user percentage

**Alerts**:
- Declining metrics
- Unusual patterns
- Threshold breaches

**Recommendations**:
- Engagement campaigns
- Feature improvements
- User outreach

### Competitive Comparison

Benchmark against industry peers:

**Access Requirements**:
- Public or monetizable privacy mode
- Active subscription
- Sufficient data

**Metrics**:
- Your performance
- Industry benchmarks
- Percentile rankings
- Best practices

**Use Cases**:
- Competitive analysis
- Strategic planning
- Performance benchmarking
- Industry positioning

---

## Privacy Controls

### Understanding Privacy Modes

#### Private Mode
- **Visibility**: Only you can see your data
- **Sharing**: No data shared with anyone
- **Comparison**: Cannot access comparison analytics
- **Earnings**: No monetization
- **Best For**: Maximum privacy, sensitive projects

#### Public Mode
- **Visibility**: Anonymized in aggregate statistics
- **Sharing**: Contributes to industry benchmarks
- **Comparison**: Can access comparison analytics
- **Earnings**: No monetization
- **Best For**: Contributing to ecosystem, benchmarking

#### Monetizable Mode
- **Visibility**: Available for purchase by other users
- **Sharing**: Detailed data accessible after payment
- **Comparison**: Can access comparison analytics
- **Earnings**: 70% of purchase price
- **Best For**: Earning from your data, established projects

### Changing Privacy Mode

1. Navigate to Wallet Details
2. Click "Edit Privacy Mode"
3. Select new mode
4. If monetizable, set your fee
5. Click "Update"

**Important**: Changes are immediate and affect all analytics queries.

### Setting Monetization Fees

For monetizable wallets:

1. Choose your data access fee (in ZEC)
2. Consider:
   - Data uniqueness
   - Market demand
   - Competitive pricing
3. Recommended range: 0.01 - 0.1 ZEC

---

## Subscription Management

### Free Trial

**Included**:
- 30 days full access
- All analytics dashboards
- Up to 5 wallets
- Basic support

**Activation**:
- Automatic on first project creation
- Starts immediately
- No credit card required

### Viewing Subscription Status

1. Navigate to Settings → Subscription
2. View:
   - Current plan
   - Days remaining
   - Features included
   - Billing history

### Upgrading Your Subscription

#### Premium Plan ($29/month in ZEC)

**Features**:
- Unlimited wallets
- All analytics dashboards
- Priority support
- API access
- Data export

**To Upgrade**:
1. Navigate to Settings → Subscription
2. Click "Upgrade to Premium"
3. Review plan details
4. Click "Continue"
5. Pay invoice with ZEC
6. Access granted immediately

#### Enterprise Plan (Custom)

**Features**:
- Everything in Premium
- White-label option
- Dedicated support
- Custom integrations
- SLA guarantees
- Team collaboration

**To Inquire**:
1. Click "Contact Sales"
2. Fill out form
3. Sales team will contact you

### Payment Process

1. **Invoice Created**:
   - Amount displayed in ZEC
   - Payment address generated
   - QR code provided

2. **Make Payment**:
   - Send exact amount to address
   - Or scan QR code with wallet
   - Use any Zcash wallet

3. **Confirmation**:
   - Payment detected automatically
   - Subscription activated
   - Confirmation email sent

---

## Payment & Withdrawals

### Earning from Data Monetization

When someone purchases access to your monetizable data:

1. **Payment Received**: 70% goes to you, 30% to platform
2. **Balance Updated**: Your balance increases
3. **Notification**: Email notification sent
4. **View Balance**: Check Settings → Withdrawals

### Checking Your Balance

1. Navigate to Settings → Withdrawals
2. View:
   - Current balance (ZEC)
   - Pending earnings
   - Total earned
   - Withdrawal history

### Requesting a Withdrawal

**Requirements**:
- Minimum balance: 0.01 ZEC
- Valid Zcash address
- Verified account

**Process**:
1. Navigate to Settings → Withdrawals
2. Click "Request Withdrawal"
3. Enter:
   - Amount (ZEC)
   - Your Zcash address
4. Review:
   - Amount: Your requested amount
   - Fee: Platform fee (0.0005 ZEC)
   - Net: Amount you'll receive
5. Click "Confirm Withdrawal"

**Processing**:
- Status: Pending → Processing → Sent
- Time: Usually within 24 hours
- Notification: Email when sent
- Transaction ID: Provided for verification

### Withdrawal History

View all past withdrawals:

1. Navigate to Settings → Withdrawals
2. Scroll to "Withdrawal History"
3. See:
   - Date and time
   - Amount and net
   - Status
   - Transaction ID
   - Destination address

---

## Best Practices

### Getting Accurate Analytics

1. **Add Wallets Early**: Start tracking from day one
2. **Use Descriptive Labels**: Name wallets clearly
3. **Regular Monitoring**: Check analytics weekly
4. **Set Privacy Appropriately**: Choose mode that fits your needs

### Optimizing User Retention

1. **Monitor Adoption Funnel**: Identify drop-off points
2. **Track Cohorts**: Compare retention across time
3. **Watch Productivity Scores**: Engage at-risk users
4. **Act on Recommendations**: Follow system suggestions

### Maximizing Data Monetization

1. **Build Track Record**: Establish consistent data
2. **Set Competitive Prices**: Research market rates
3. **Maintain Quality**: Ensure data accuracy
4. **Promote Availability**: Let others know you're monetizing

### Security Best Practices

1. **Strong Password**: Use unique, complex password
2. **Regular Updates**: Change password every 90 days
3. **Monitor Activity**: Check for unusual access
4. **Secure Withdrawal Address**: Verify before withdrawing

---

## FAQ

### General Questions

**Q: Is Boardling free?**
A: Yes, we offer a 30-day free trial with full access. After that, Premium is $29/month.

**Q: What cryptocurrencies do you support?**
A: Currently, we only support Zcash (ZEC).

**Q: Can I track multiple projects?**
A: Yes, you can create unlimited projects on any plan.

**Q: How often is data updated?**
A: Real-time. Our indexer syncs with the blockchain every 10 seconds.

### Privacy Questions

**Q: Who can see my data in private mode?**
A: Only you. No one else has access.

**Q: What data is shared in public mode?**
A: Only anonymized, aggregated statistics. No wallet addresses or identifying information.

**Q: Can I change privacy mode later?**
A: Yes, anytime. Changes take effect immediately.

**Q: How is monetizable data protected?**
A: Only accessible after payment. Buyers must have active subscriptions.

### Technical Questions

**Q: What wallet types are supported?**
A: All Zcash address types: transparent (t), shielded (z), and unified (u).

**Q: How far back does historical data go?**
A: We index from the block height when you add the wallet.

**Q: Can I export my data?**
A: Yes, Premium and Enterprise plans include data export.

**Q: Is there an API?**
A: Yes, available on Premium and Enterprise plans.

### Billing Questions

**Q: How do I pay for subscriptions?**
A: With Zcash (ZEC). We generate an invoice with payment address.

**Q: When does my subscription renew?**
A: Monthly, on the same day you subscribed.

**Q: Can I cancel anytime?**
A: Yes, no long-term contracts. Cancel from Settings.

**Q: Do you offer refunds?**
A: Refunds are evaluated case-by-case. Contact support.

---

## Troubleshooting

### Login Issues

**Problem**: Can't log in
**Solutions**:
1. Verify email and password are correct
2. Check for typos
3. Try password reset
4. Clear browser cache
5. Try different browser

**Problem**: "Invalid credentials" error
**Solutions**:
1. Confirm email is registered
2. Use "Forgot Password" to reset
3. Check for account suspension (email notification)

### Wallet Issues

**Problem**: Wallet address rejected
**Solutions**:
1. Verify address format (t1, zs1, or u1 prefix)
2. Check network (mainnet vs testnet)
3. Copy address carefully (no extra spaces)
4. Try different address

**Problem**: No transactions showing
**Solutions**:
1. Wait for indexer to sync (can take 10-30 minutes)
2. Verify wallet has transactions on blockchain
3. Check if wallet was added recently
4. Refresh page

### Analytics Issues

**Problem**: Data not updating
**Solutions**:
1. Refresh page
2. Clear browser cache
3. Check if indexer is running (status page)
4. Wait 5-10 minutes for cache to expire

**Problem**: Missing analytics
**Solutions**:
1. Verify subscription is active
2. Check if feature requires Premium
3. Ensure wallet has sufficient data
4. Try different date range

### Payment Issues

**Problem**: Payment not detected
**Solutions**:
1. Verify correct amount sent
2. Check transaction confirmations (need 1+)
3. Wait 10-15 minutes for detection
4. Contact support with transaction ID

**Problem**: Withdrawal pending too long
**Solutions**:
1. Check status in withdrawal history
2. Verify address is correct
3. Wait 24 hours
4. Contact support if still pending

### Performance Issues

**Problem**: Slow loading
**Solutions**:
1. Check internet connection
2. Try different browser
3. Clear cache and cookies
4. Disable browser extensions
5. Check status page for outages

---

## Getting Help

### Support Channels

**Email Support**:
- support@boardling.com
- Response time: 24-48 hours (free trial)
- Response time: 4-8 hours (Premium)
- Response time: 1-2 hours (Enterprise)

**Documentation**:
- User Guide: https://docs.boardling.com/user-guide
- API Docs: https://docs.boardling.com/api
- Video Tutorials: https://boardling.com/tutorials

**Community**:
- Discord: https://discord.gg/boardling
- Twitter: @boardling
- GitHub: https://github.com/boardling

**Status Page**:
- https://status.boardling.com
- Real-time system status
- Incident history
- Maintenance schedule

### Providing Feedback

We love hearing from users!

**Feature Requests**:
- Email: feedback@boardling.com
- Or use in-app feedback button

**Bug Reports**:
- Email: bugs@boardling.com
- Include: Steps to reproduce, screenshots, browser info

**General Feedback**:
- Email: hello@boardling.com
- Or reach out on social media

---

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + N` | New project |
| `Ctrl/Cmd + W` | Add wallet |
| `Ctrl/Cmd + ,` | Settings |
| `Ctrl/Cmd + /` | Help |
| `Esc` | Close modal |

---

## Glossary

**Adoption Stage**: Phase in user journey (created, first_tx, feature_usage, recurring, high_value)

**Cohort**: Group of wallets created in the same time period

**Monetizable Data**: Analytics data available for purchase by other users

**Privacy Mode**: Setting controlling data sharing (private, public, monetizable)

**Productivity Score**: 0-100 score measuring wallet health and engagement

**Shielded Transaction**: Privacy-preserving Zcash transaction using z-addresses

**Transparent Transaction**: Public Zcash transaction using t-addresses

**Unified Address**: Zcash address supporting both transparent and shielded

**Wallet**: Zcash address being tracked for analytics

**ZEC**: Zcash cryptocurrency

---

## Next Steps

Now that you understand Boardling, here's what to do next:

1. ✅ Complete onboarding
2. ✅ Add your wallets
3. ✅ Explore analytics dashboards
4. ✅ Set appropriate privacy modes
5. ✅ Monitor your metrics weekly
6. ✅ Upgrade to Premium when ready
7. ✅ Consider data monetization
8. ✅ Join our community

**Welcome to Boardling! 🚀**

We're excited to help you understand and optimize your Zcash user base. If you have any questions, don't hesitate to reach out to our support team.

Happy analyzing!

---

*Last updated: January 2024*
*Version: 1.0.0*
