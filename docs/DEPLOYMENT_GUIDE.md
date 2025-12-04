# Boardling Deployment Guide

## Overview

This guide covers deploying the Boardling platform to production. The platform consists of three main components:

1. **Frontend Application** (React/TypeScript)
2. **Backend API** (Node.js/Express)
3. **Blockchain Indexer** (Node.js/PostgreSQL)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 50GB SSD
- **Network**: Stable internet connection for blockchain sync

### Required Services

- PostgreSQL database
- Zcash RPC node (Zebra or Zaino)
- SMTP server (for email notifications)
- Domain name with SSL certificate

### Required Tools

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
sudo apt-get install nginx

# Install Certbot for SSL
sudo apt-get install certbot python3-certbot-nginx
```

---

## Database Setup

### 1. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE boardling;
CREATE USER boardling_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE boardling TO boardling_user;
\q
```

### 2. Run Migrations

```bash
cd backend

# Run main schema
psql -U boardling_user -d boardling -f schema.sql

# Run migrations in order
psql -U boardling_user -d boardling -f migrations/001_add_wallet_analytics.sql
psql -U boardling_user -d boardling -f migrations/002_add_transactions_table.sql
psql -U boardling_user -d boardling -f migrations/003_shielded_tables.sql
# ... continue with all migrations
```

### 3. Verify Database

```bash
psql -U boardling_user -d boardling -c "\dt"
```

---

## Zcash Node Setup

### Option 1: Zebra + Zaino (Recommended)

```bash
# Install Zebra
cd ~
git clone https://github.com/ZcashFoundation/zebra.git
cd zebra
cargo build --release

# Configure Zebra
mkdir -p ~/.config/zebra
cp zebrad-conf.toml ~/.config/zebra/

# Start Zebra
./target/release/zebrad start

# Install Zaino
cd ~
git clone https://github.com/zingolabs/zaino.git
cd zaino
cargo build --release

# Configure Zaino
cp zaino.toml ~/.config/zaino/

# Start Zaino
./target/release/zaino start
```

### Option 2: Public RPC (Development Only)

For development/testing, you can use a public RPC:

```env
ZCASH_RPC_URL=https://zcash-mainnet.chainstacklabs.com
```

**Note**: Public RPCs have rate limits and are not suitable for production.

---

## Backend Deployment

### 1. Clone Repository

```bash
cd /var/www
git clone https://github.com/your-org/boardling.git
cd boardling/backend
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update with production values (see Environment Variables section below).

### 4. Build Application

```bash
npm run build
```

### 5. Start with PM2

```bash
# Start backend API
pm2 start app.js --name boardling-api

# Start indexer
cd indexer
pm2 start start.js --name boardling-indexer

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 6. Monitor Processes

```bash
# View logs
pm2 logs boardling-api
pm2 logs boardling-indexer

# Monitor status
pm2 status

# Restart services
pm2 restart boardling-api
pm2 restart boardling-indexer
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd /var/www/boardling
npm install
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/boardling
```

Add configuration:

```nginx
server {
    listen 80;
    server_name boardling.com www.boardling.com;

    # Frontend
    location / {
        root /var/www/boardling/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth endpoints
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/boardling /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d boardling.com -d www.boardling.com
```

Follow prompts to configure SSL. Certbot will automatically update Nginx configuration.

### 4. Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

---

## Environment Variables

### Backend (.env)

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=boardling_user
DB_PASS=your_secure_password
DB_NAME=boardling
DB_SSL=true

# JWT Configuration
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_IN=1h

# Zcash RPC Configuration
ZCASH_RPC_URL=http://localhost:8233
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASS=your_rpc_password

# Platform Configuration
PLATFORM_TREASURY_ADDRESS=t1YourTreasuryAddressHere
PLATFORM_FEE_PERCENTAGE=30
WITHDRAWAL_FEE_ZEC=0.0005

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@boardling.com

# CORS Configuration
CORS_ORIGIN=https://boardling.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/boardling/app.log

# Cache Configuration
CACHE_TTL_SECONDS=300
CACHE_ENABLED=true

# Feature Flags
ENABLE_EMAIL_VERIFICATION=true
ENABLE_TWO_FACTOR=false
ENABLE_WEBHOOKS=false
```

### Indexer (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=boardling_user
DB_PASS=your_secure_password
DB_NAME=boardling

# Zcash RPC Configuration
ZCASH_RPC_URL=http://localhost:8233
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASS=your_rpc_password

# Indexer Configuration
START_BLOCK=0
BATCH_SIZE=100
SYNC_INTERVAL_MS=10000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/boardling/indexer.log
```

### Frontend (Environment Variables)

Create `.env.production`:

```env
VITE_API_URL=https://boardling.com
VITE_APP_NAME=Boardling
VITE_ENABLE_ANALYTICS=true
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. PostgreSQL Security

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Ensure only local connections:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

### 3. Secure Environment Files

```bash
# Restrict access to .env files
chmod 600 /var/www/boardling/backend/.env
chmod 600 /var/www/boardling/backend/indexer/.env

# Set proper ownership
chown www-data:www-data /var/www/boardling/backend/.env
```

### 4. Enable Fail2Ban

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. Regular Updates

```bash
# Setup automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Monitoring and Logging

### 1. Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/boardling
```

Add configuration:
```
/var/log/boardling/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Monitor with PM2

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Database Monitoring

```bash
# Monitor active connections
psql -U boardling_user -d boardling -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor database size
psql -U boardling_user -d boardling -c "SELECT pg_size_pretty(pg_database_size('boardling'));"
```

### 4. Setup Health Checks

Create a monitoring script:

```bash
#!/bin/bash
# /usr/local/bin/boardling-health-check.sh

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ $API_STATUS -ne 200 ]; then
    echo "API is down! Status: $API_STATUS"
    pm2 restart boardling-api
fi

# Check indexer
INDEXER_STATUS=$(pm2 jlist | jq '.[] | select(.name=="boardling-indexer") | .pm2_env.status')

if [ "$INDEXER_STATUS" != "\"online\"" ]; then
    echo "Indexer is down!"
    pm2 restart boardling-indexer
fi
```

Add to crontab:
```bash
crontab -e
# Add: */5 * * * * /usr/local/bin/boardling-health-check.sh
```

---

## Backup Strategy

### 1. Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-boardling-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/boardling"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="boardling_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U boardling_user boardling | gzip > $BACKUP_DIR/$FILENAME

# Keep only last 7 days
find $BACKUP_DIR -name "boardling_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Make executable and schedule:
```bash
chmod +x /usr/local/bin/backup-boardling-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-boardling-db.sh
```

### 2. Application Backups

```bash
# Backup application files
tar -czf /var/backups/boardling/app_$(date +%Y%m%d).tar.gz \
    /var/www/boardling \
    --exclude=node_modules \
    --exclude=dist
```

### 3. Restore from Backup

```bash
# Restore database
gunzip < /var/backups/boardling/boardling_20240101_020000.sql.gz | \
    psql -U boardling_user -d boardling

# Restore application
tar -xzf /var/backups/boardling/app_20240101.tar.gz -C /
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or HAProxy to distribute traffic
2. **Multiple API Instances**: Run multiple backend instances with PM2 cluster mode
3. **Database Replication**: Setup PostgreSQL read replicas
4. **CDN**: Use CloudFlare or similar for static assets

### Vertical Scaling

1. **Increase Server Resources**: More CPU, RAM, and storage
2. **Optimize Database**: Add indexes, tune PostgreSQL configuration
3. **Cache Layer**: Implement Redis for frequently accessed data

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_wallets_project_id ON wallets(project_id);
CREATE INDEX idx_wallet_activity_wallet_id ON wallet_activity_metrics(wallet_id);
CREATE INDEX idx_wallet_activity_date ON wallet_activity_metrics(activity_date);

-- Analyze tables
ANALYZE wallets;
ANALYZE wallet_activity_metrics;
```

---

## Troubleshooting

### API Not Responding

```bash
# Check if process is running
pm2 status

# Check logs
pm2 logs boardling-api --lines 100

# Restart service
pm2 restart boardling-api
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
psql -U boardling_user -d boardling -c "SELECT count(*) FROM pg_stat_activity;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Indexer Not Syncing

```bash
# Check indexer logs
pm2 logs boardling-indexer

# Check RPC connection
curl -X POST http://localhost:8233 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getblockchaininfo","params":[],"id":1}'

# Restart indexer
pm2 restart boardling-indexer
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart with memory limit
pm2 restart boardling-api --max-memory-restart 1G
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t
```

---

## Rollback Procedure

### 1. Rollback Application

```bash
# Stop current version
pm2 stop all

# Checkout previous version
cd /var/www/boardling
git checkout <previous-commit-hash>

# Reinstall dependencies
cd backend
npm install

# Restart services
pm2 restart all
```

### 2. Rollback Database

```bash
# Restore from backup
gunzip < /var/backups/boardling/boardling_<timestamp>.sql.gz | \
    psql -U boardling_user -d boardling
```

---

## Performance Optimization

### 1. Enable Gzip Compression

Add to Nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. Enable HTTP/2

```nginx
listen 443 ssl http2;
```

### 3. Optimize PostgreSQL

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

---

## Maintenance Windows

Schedule regular maintenance:

1. **Weekly**: Review logs, check disk space
2. **Monthly**: Update dependencies, security patches
3. **Quarterly**: Performance review, capacity planning

---

## Support and Resources

- **Documentation**: https://docs.boardling.com
- **Status Page**: https://status.boardling.com
- **Support Email**: support@boardling.com
- **Emergency Contact**: emergency@boardling.com

---

## Checklist

Before going live:

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Health checks configured
- [ ] Log rotation enabled
- [ ] PM2 startup configured
- [ ] DNS records updated
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated
- [ ] Team trained on deployment
- [ ] Rollback procedure tested
