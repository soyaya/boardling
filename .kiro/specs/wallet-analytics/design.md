# Wallet Analytics Platform Design Document

## Overview

The Wallet Analytics Platform is a comprehensive analytics ecosystem that transforms raw Zcash blockchain data into actionable business intelligence for project owners. The system processes transaction data from multiple sources (Zcash RPC, indexers, and direct blockchain monitoring) to provide multi-dimensional insights including retention analysis, adoption funnels, productivity scoring, competitive benchmarking, and AI-driven recommendations.

The platform operates as a real-time analytics engine that continuously monitors wallet activities, calculates behavioral metrics, generates predictive scores, and provides task-based recommendations with completion tracking through on-chain activity monitoring. It supports both transparent and shielded transactions, handles privacy controls, and enables data monetization while maintaining user anonymity.

## Architecture

### High-Level Architecture

The system follows a layered microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Analytics Engine  │  Scoring Engine  │  Recommendation AI  │
├─────────────────────────────────────────────────────────────┤
│     Data Processing Layer (ETL Pipeline)                    │
├─────────────────────────────────────────────────────────────┤
│  Blockchain Indexer  │  Transaction Parser  │  Data Store   │
├─────────────────────────────────────────────────────────────┤
│           Zcash Network (RPC/Indexer Sources)              │
└─────────────────────────────────────────────────────────────┘
```

### Core Architectural Principles

1. **Event-Driven Processing**: Real-time transaction processing with event streaming
2. **Microservices Design**: Loosely coupled services for scalability and maintainability
3. **Data Lake Architecture**: Centralized storage with multiple processing engines
4. **Privacy-First Design**: Anonymization and encryption at the data layer
5. **Horizontal Scalability**: Auto-scaling components based on transaction volume

## Components and Interfaces

### 1. Data Ingestion Layer

**Blockchain Data Collector**
- Interfaces with existing Zcash indexer and RPC endpoints
- Processes transparent and shielded transactions
- Handles real-time transaction streaming
- Manages data validation and deduplication

**Transaction Parser**
- Extends existing `txParser.js` functionality
- Extracts behavioral metadata from transactions
- Identifies transaction types (transfer, swap, bridge, shielded)
- Captures sequence and timing information

### 2. Analytics Processing Engine

**Cohort Analysis Engine**
- Automatically assigns wallets to time-based cohorts
- Calculates retention percentages across multiple periods
- Generates heatmap visualization data
- Tracks cohort progression and lifecycle metrics

**Adoption Funnel Processor**
- Monitors wallet progression through adoption stages
- Calculates conversion rates and drop-off percentages
- Identifies bottlenecks and optimization opportunities
- Provides segmented funnel analysis

**Behavior Flow Analyzer**
- Tracks transaction sequences and patterns
- Identifies recurring behaviors and habits
- Maps user journeys through features
- Detects anomalies and unusual patterns

### 3. Scoring and Intelligence Layer

**Productivity Score Calculator**
- Combines multiple metrics into 0-100 scores
- Weighs retention, adoption, churn, frequency, and activity
- Updates scores in real-time based on new activities
- Provides component-level score breakdowns

**AI Recommendation Engine**
- Generates task-based recommendations
- Monitors on-chain activity for task completion detection
- Tracks recommendation effectiveness
- Learns from successful intervention patterns

**Churn Prediction Model**
- Identifies wallets at risk of disengagement
- Calculates churn probability scores
- Provides early warning alerts
- Suggests retention strategies

### 4. Privacy and Monetization Layer

**Privacy Controller**
- Manages user privacy preferences
- Handles data anonymization and aggregation
- Controls access to monetizable data
- Ensures compliance with privacy settings

**Monetization Engine**
- Processes pay-per-analytics requests
- Distributes earnings to wallet owners
- Manages data access permissions
- Handles payment processing and accounting

## Data Models

### Core Analytics Tables

```sql
-- Wallet activity tracking with comprehensive metrics
CREATE TABLE wallet_activity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    activity_date DATE NOT NULL,
    
    -- Core transaction metrics
    transaction_count INTEGER DEFAULT 0,
    unique_days_active INTEGER DEFAULT 0,
    total_volume_zatoshi BIGINT DEFAULT 0,
    total_fees_paid BIGINT DEFAULT 0,
    
    -- Transaction type breakdown
    transfers_count INTEGER DEFAULT 0,
    swaps_count INTEGER DEFAULT 0,
    bridges_count INTEGER DEFAULT 0,
    shielded_count INTEGER DEFAULT 0,
    
    -- Behavioral metrics
    is_active BOOLEAN DEFAULT FALSE,
    is_returning BOOLEAN DEFAULT FALSE,
    days_since_creation INTEGER DEFAULT 0,
    sequence_complexity_score INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cohort management and assignments
CREATE TABLE wallet_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_type TEXT NOT NULL, -- 'weekly', 'monthly'
    cohort_period DATE NOT NULL,
    wallet_count INTEGER DEFAULT 0,
    retention_week_1 DECIMAL(5,2),
    retention_week_2 DECIMAL(5,2),
    retention_week_3 DECIMAL(5,2),
    retention_week_4 DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Adoption funnel tracking
CREATE TABLE wallet_adoption_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    stage_name TEXT NOT NULL, -- 'created', 'first_tx', 'feature_usage', 'recurring', 'high_value'
    achieved_at TIMESTAMP,
    time_to_achieve_hours INTEGER,
    conversion_probability DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Productivity scoring with component breakdown
CREATE TABLE wallet_productivity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    
    -- Overall score and components
    total_score INTEGER DEFAULT 0, -- 0-100
    retention_score INTEGER DEFAULT 0,
    adoption_score INTEGER DEFAULT 0,
    activity_score INTEGER DEFAULT 0,
    diversity_score INTEGER DEFAULT 0,
    
    -- Status indicators
    status TEXT DEFAULT 'healthy', -- 'healthy', 'at_risk', 'churn'
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
    
    -- Task tracking
    pending_tasks JSONB DEFAULT '[]',
    completed_tasks JSONB DEFAULT '[]',
    
    calculated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(wallet_id)
);

-- Behavior flow and sequence tracking
CREATE TABLE wallet_behavior_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    session_id UUID DEFAULT gen_random_uuid(),
    
    -- Flow metadata
    flow_sequence JSONB NOT NULL, -- Array of actions with timestamps
    flow_duration_minutes INTEGER,
    flow_complexity_score INTEGER,
    
    -- Classification
    flow_type TEXT, -- 'simple_transfer', 'complex_defi', 'privacy_focused'
    success_indicator BOOLEAN DEFAULT TRUE,
    
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);

-- Shielded pool specific analytics
CREATE TABLE shielded_pool_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    analysis_date DATE NOT NULL,
    
    -- Shielded activity metrics
    shielded_tx_count INTEGER DEFAULT 0,
    transparent_to_shielded_count INTEGER DEFAULT 0,
    shielded_to_transparent_count INTEGER DEFAULT 0,
    internal_shielded_count INTEGER DEFAULT 0,
    
    -- Privacy behavior analysis
    avg_shielded_duration_hours DECIMAL(10,2),
    shielded_volume_zatoshi BIGINT DEFAULT 0,
    privacy_score INTEGER DEFAULT 0, -- 0-100
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Competitive benchmarking data
CREATE TABLE competitive_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_type TEXT NOT NULL, -- 'productivity', 'retention', 'adoption'
    category TEXT NOT NULL, -- 'defi', 'gamefi', etc.
    
    -- Benchmark metrics
    percentile_25 DECIMAL(10,4),
    percentile_50 DECIMAL(10,4),
    percentile_75 DECIMAL(10,4),
    percentile_90 DECIMAL(10,4),
    
    sample_size INTEGER,
    calculation_date DATE NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI recommendations and task tracking
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    project_id UUID REFERENCES projects(id),
    
    -- Recommendation details
    recommendation_type TEXT NOT NULL, -- 'marketing', 'onboarding', 'feature_enhancement'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Task tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
    completion_indicators JSONB, -- On-chain signals that indicate completion
    
    -- Effectiveness tracking
    baseline_metrics JSONB,
    current_metrics JSONB,
    effectiveness_score DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Privacy and monetization controls
CREATE TABLE wallet_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    
    -- Privacy controls
    data_sharing_level TEXT DEFAULT 'private', -- 'private', 'public', 'monetizable'
    anonymization_level TEXT DEFAULT 'high', -- 'low', 'medium', 'high'
    
    -- Monetization settings
    monetization_enabled BOOLEAN DEFAULT FALSE,
    earnings_address TEXT,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 50.00,
    
    -- Access controls
    allowed_analytics_types TEXT[] DEFAULT ARRAY['basic'],
    data_retention_days INTEGER DEFAULT 365,
    
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Extended Transaction Processing

```sql
-- Enhanced transaction processing for analytics
CREATE TABLE processed_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    
    -- Transaction identification
    txid VARCHAR(64) NOT NULL,
    block_height INTEGER,
    block_timestamp TIMESTAMP,
    
    -- Enhanced classification
    tx_type TEXT NOT NULL, -- 'transfer', 'swap', 'bridge', 'shielded', 'contract'
    tx_subtype TEXT, -- 'incoming', 'outgoing', 'self', 'multi_party'
    
    -- Value and fee analysis
    value_zatoshi BIGINT DEFAULT 0,
    fee_zatoshi BIGINT DEFAULT 0,
    usd_value_at_time DECIMAL(12,2),
    
    -- Behavioral context
    counterparty_address TEXT,
    counterparty_type TEXT, -- 'exchange', 'defi', 'wallet', 'unknown'
    feature_used TEXT, -- Which app feature triggered this transaction
    
    -- Sequence analysis
    sequence_position INTEGER,
    session_id UUID,
    time_since_previous_tx_minutes INTEGER,
    
    -- Privacy analysis (for shielded transactions)
    is_shielded BOOLEAN DEFAULT FALSE,
    shielded_pool_entry BOOLEAN DEFAULT FALSE,
    shielded_pool_exit BOOLEAN DEFAULT FALSE,
    
    processed_at TIMESTAMP DEFAULT NOW()
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Let me analyze the acceptance criteria to determine which are testable as properties:

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated to eliminate redundancy:

**Consolidation Opportunities:**
- Properties 1.1-1.5 (activity tracking) can be combined into comprehensive transaction processing properties
- Properties 2.1-2.5 (adoption funnel) share common calculation logic that can be unified
- Properties 3.1-3.5 (cohort analysis) have overlapping retention calculation requirements
- Properties 4.1-4.5 (productivity scoring) can be consolidated around score calculation accuracy
- Properties 5.1-5.5 (shielded analytics) share transaction classification and analysis logic
- Properties 6.1-6.5 (competitive analysis) have common comparison calculation patterns
- Properties 7.1-7.5 (alerts) share threshold-based notification logic
- Properties 8.1-8.5 (privacy controls) can be unified around access control enforcement

**Redundancy Elimination:**
- Combining transaction metadata capture (1.2) with behavior flow tracking (1.3) into comprehensive transaction processing
- Merging conversion rate calculations (2.2) with drop-off calculations (2.3) as they are mathematically related
- Unifying retention calculations (3.2) with trend detection (3.5) as both involve retention metrics
- Consolidating score calculations (4.1) with score updates (4.4) into comprehensive scoring properties

Property 1: Comprehensive Transaction Processing
*For any* wallet added to a project, all subsequent transactions should be tracked with complete metadata including type, amount, fees, timestamps, counterparties, pre/post states, and behavioral context
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

Property 2: Adoption Funnel Accuracy
*For any* set of wallets and adoption stages, conversion rates and drop-off percentages should be mathematically accurate, and time-to-stage calculations should reflect actual progression times with proper segmentation
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 3: Cohort Retention Consistency
*For any* cohort of wallets, retention percentages should be calculated consistently across time periods, with proper classification of new vs returning wallets and accurate trend detection
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 4: Productivity Scoring Integrity
*For any* wallet, productivity scores should accurately combine all component metrics (retention, adoption, churn, frequency, activity) into a 0-100 score, with proper task tracking and score updates when tasks are completed
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

Property 5: Shielded Analytics Completeness
*For any* shielded transaction, all z-address activities, transparent-to-shielded movements, and internal transfers should be tracked with accurate percentage calculations and pattern recognition
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 6: Competitive Analysis Accuracy
*For any* project comparison, metrics should be accurately calculated against benchmarks with proper gap identification and trend tracking
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

Property 7: Alert Generation Reliability
*For any* threshold-based condition (retention drops, churn risks, funnel changes, shielded activity spikes), alerts should be generated when thresholds are exceeded and include appropriate AI-generated recommendations
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

Property 8: Privacy Control Enforcement
*For any* privacy setting change, the new restrictions should be immediately applied to data access and sharing, with proper monetization handling and anonymization
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

Property 9: Data Integrity Maintenance
*For any* data storage operation, referential integrity should be maintained and duplicate or inconsistent records should be prevented
**Validates: Requirements 9.3**

## Error Handling

### Transaction Processing Errors

**Invalid Transaction Data**
- Malformed transaction IDs or block hashes
- Missing required metadata fields
- Timestamp inconsistencies
- Invalid wallet addresses

**Error Response**: Log error, skip invalid transaction, continue processing, alert monitoring system

**Blockchain Connectivity Issues**
- RPC endpoint unavailable
- Indexer service down
- Network timeouts
- Data synchronization lag

**Error Response**: Implement exponential backoff retry, fallback to secondary data sources, queue transactions for later processing

### Analytics Calculation Errors

**Score Calculation Failures**
- Division by zero in percentage calculations
- Missing historical data for trend analysis
- Insufficient data for statistical significance

**Error Response**: Use default values, interpolate missing data points, flag calculations as preliminary

**Cohort Assignment Errors**
- Wallet creation date inconsistencies
- Duplicate cohort assignments
- Invalid time period boundaries

**Error Response**: Reassign to correct cohort, remove duplicates, use creation timestamp as source of truth

### Privacy and Access Control Errors

**Privacy Setting Conflicts**
- Monetization enabled without proper consent
- Data access requests for private wallets
- Anonymization failures

**Error Response**: Default to most restrictive privacy setting, deny access, re-anonymize data

**Monetization Processing Errors**
- Payment distribution failures
- Earnings calculation errors
- Invalid wallet addresses for payments

**Error Response**: Queue payments for retry, recalculate earnings, validate addresses before processing

## Testing Strategy

The Wallet Analytics Platform requires a dual testing approach combining unit tests for specific functionality and property-based tests for universal correctness guarantees.

### Unit Testing Approach

Unit tests will focus on:
- **Specific Transaction Scenarios**: Test known transaction patterns and edge cases
- **Integration Points**: Verify connections between analytics engine and blockchain indexer
- **API Endpoints**: Validate request/response handling and error conditions
- **Database Operations**: Test CRUD operations and query performance
- **Privacy Controls**: Verify access restrictions and data anonymization

**Testing Framework**: Jest with custom matchers for blockchain data validation
**Coverage Target**: 90% code coverage for core analytics functions
**Mock Strategy**: Mock blockchain RPC calls and external API dependencies

### Property-Based Testing Approach

Property-based tests will verify universal properties across all valid inputs using **fast-check** library for JavaScript/TypeScript.

**Configuration**: Each property test will run a minimum of 100 iterations to ensure statistical confidence in random input testing.

**Property Test Requirements**:
- Each property-based test must include a comment explicitly referencing the correctness property from this design document
- Comment format: `**Feature: wallet-analytics, Property {number}: {property_text}**`
- Each correctness property must be implemented by exactly one property-based test
- Tests must use smart generators that constrain inputs to valid wallet analytics scenarios

**Property Test Categories**:

1. **Transaction Processing Properties**
   - Generate random wallet transactions with various types and metadata
   - Verify complete data capture and behavioral context tracking
   - Test edge cases like simultaneous transactions and rapid sequences

2. **Scoring Algorithm Properties**
   - Generate random wallet activity patterns
   - Verify score calculations remain within 0-100 bounds
   - Test score component weighting and aggregation logic

3. **Cohort Analysis Properties**
   - Generate random wallet creation patterns across time periods
   - Verify retention calculations and cohort assignments
   - Test boundary conditions at period transitions

4. **Privacy Enforcement Properties**
   - Generate random privacy setting combinations
   - Verify access control enforcement and data anonymization
   - Test monetization scenarios with various permission levels

**Generator Strategy**:
- **Wallet Generator**: Creates valid wallet addresses with realistic transaction histories
- **Transaction Generator**: Produces diverse transaction types with proper metadata
- **Time Series Generator**: Creates realistic temporal patterns for cohort analysis
- **Privacy Setting Generator**: Generates valid combinations of privacy preferences

**Property Test Execution**:
- Run property tests in CI/CD pipeline on every commit
- Generate detailed failure reports with counterexamples
- Maintain property test performance under 30 seconds total execution time

### Integration Testing

**End-to-End Scenarios**:
- Complete wallet lifecycle from creation to churn prediction
- Multi-wallet project analytics with competitive benchmarking
- Privacy setting changes with immediate enforcement verification
- Task recommendation generation and completion detection

**Performance Testing**:
- Load testing with 10,000+ concurrent wallet transactions
- Stress testing analytics calculations with large datasets
- Memory usage profiling during batch processing operations

**Security Testing**:
- Privacy leak detection in anonymized data
- Access control bypass attempts
- Data integrity verification under concurrent access

The testing strategy ensures both functional correctness through property-based testing and practical reliability through comprehensive unit and integration testing.

## Implementation Architecture

### Technology Stack

**Backend Services**:
- **Node.js/Express**: API layer and microservices
- **PostgreSQL**: Primary data store with analytics extensions
- **Redis**: Caching layer and real-time data processing
- **Apache Kafka**: Event streaming for transaction processing
- **Docker**: Containerization for scalable deployment

**Analytics Processing**:
- **Apache Spark**: Large-scale data processing and ML pipelines
- **TensorFlow.js**: AI recommendation engine and churn prediction
- **D3.js**: Data visualization and chart generation
- **WebSockets**: Real-time dashboard updates

**Blockchain Integration**:
- **Existing Zcash Indexer**: Transaction data source
- **Zcash RPC**: Direct blockchain connectivity
- **Custom Transaction Parser**: Enhanced metadata extraction

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                    │
├─────────────────────────────────────────────────────────────┤
│  Analytics API  │  Scoring API  │  Privacy API  │  Alert API │
├─────────────────────────────────────────────────────────────┤
│           Event Processing Layer (Kafka Streams)            │
├─────────────────────────────────────────────────────────────┤
│  Transaction    │  Cohort       │  Scoring      │  AI Rec    │
│  Processor      │  Analyzer     │  Engine       │  Engine    │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL     │  Redis Cache  │  File Storage │  ML Models │
│  Analytics DB   │  Real-time    │  Exports      │  Training  │
└─────────────────────────────────────────────────────────────┘
```

### Database Design Patterns

**Time-Series Optimization**:
- Partitioned tables by date for activity metrics
- Materialized views for pre-calculated aggregations
- Automated data archival for historical analytics

**Real-Time Processing**:
- Event sourcing for transaction state changes
- CQRS pattern for read/write separation
- Eventual consistency for analytics calculations

**Privacy-First Design**:
- Column-level encryption for sensitive data
- Row-level security for multi-tenant access
- Audit logging for data access tracking

### Scalability Considerations

**Horizontal Scaling**:
- Microservices architecture with independent scaling
- Database sharding by project or time period
- Load balancing across analytics processing nodes

**Performance Optimization**:
- Intelligent caching strategies for frequently accessed data
- Batch processing for non-real-time analytics
- Asynchronous processing for heavy computations

**Data Management**:
- Automated data lifecycle management
- Compression for historical transaction data
- Backup and disaster recovery procedures

## Deployment and Operations

### Infrastructure Requirements

**Minimum Production Setup**:
- 3x Application servers (4 CPU, 16GB RAM)
- 2x Database servers (8 CPU, 32GB RAM, SSD storage)
- 1x Redis cluster (3 nodes, 8GB RAM each)
- 1x Kafka cluster (3 brokers, 4 CPU, 8GB RAM each)

**Monitoring and Observability**:
- Application performance monitoring (APM)
- Database query performance tracking
- Real-time alerting for system health
- Analytics accuracy monitoring

### Security Considerations

**Data Protection**:
- End-to-end encryption for sensitive analytics data
- Regular security audits and penetration testing
- Compliance with data protection regulations
- Secure API authentication and authorization

**Privacy Enforcement**:
- Automated privacy setting enforcement
- Data anonymization verification
- Access logging and audit trails
- Regular privacy impact assessments

### Maintenance and Updates

**Continuous Integration**:
- Automated testing pipeline with property-based tests
- Staged deployment with rollback capabilities
- Database migration management
- Performance regression testing

**Operational Procedures**:
- Regular backup verification and recovery testing
- Capacity planning and scaling procedures
- Incident response and escalation protocols
- Documentation and knowledge management

This comprehensive design provides a robust foundation for implementing the Wallet Analytics Platform with proper attention to scalability, privacy, and operational excellence.