#!/bin/bash

echo "🚀 Zcash RPC Setup Script"
echo "========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

echo ""
echo "Choose your Zcash RPC setup:"
echo "1) Use public RPC service (quick, for development)"
echo "2) Run local Zebra node with Docker (full node, ~50GB storage)"
echo "3) Run Zebra + Zaino with Docker (full setup with indexer)"
echo "4) Manual configuration help"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "📡 Configuring for public RPC service..."
        # Update .env file for public service
        sed -i 's|ZCASH_RPC_URL=.*|ZCASH_RPC_URL=https://mainnet.lightwalletd.com:9067|' backend/.env
        sed -i 's|ZCASH_RPC_USER=.*|ZCASH_RPC_USER=|' backend/.env
        sed -i 's|ZCASH_RPC_PASS=.*|ZCASH_RPC_PASS=|' backend/.env
        echo "✅ Configuration updated for public RPC service"
        echo "⚠️  Note: Public services may have rate limits"
        ;;
    2)
        echo "🐋 Starting Zebra node with Docker..."
        docker-compose -f docker-compose.zcash.yml up -d zebra
        # Update .env for local Zebra
        sed -i 's|ZCASH_RPC_URL=.*|ZCASH_RPC_URL=http://localhost:8232|' backend/.env
        echo "✅ Zebra node starting... This will take 15-16 hours for initial sync"
        echo "📊 Monitor progress: docker logs -f zcash-zebra"
        ;;
    3)
        echo "🐋 Starting Zebra + Zaino with Docker..."
        docker-compose -f docker-compose.zcash.yml up -d
        # Update .env for Zaino
        sed -i 's|ZCASH_RPC_URL=.*|ZCASH_RPC_URL=http://localhost:8234|' backend/.env
        echo "✅ Zebra + Zaino starting..."
        echo "📊 Monitor Zebra: docker logs -f zcash-zebra"
        echo "📊 Monitor Zaino: docker logs -f zcash-zaino"
        ;;
    4)
        echo "📖 Manual Configuration Help"
        echo ""
        echo "For Zebra (full node):"
        echo "- Download from: https://github.com/ZcashFoundation/zebra/releases"
        echo "- Config file: ~/.zebra/zebra.toml"
        echo "- RPC endpoint: http://localhost:8232"
        echo ""
        echo "For Zaino (indexer):"
        echo "- Clone from: https://github.com/zingolabs/zaino"
        echo "- Build with: cargo build --release"
        echo "- RPC endpoint: http://localhost:8233"
        echo ""
        echo "Update your backend/.env file with the appropriate RPC_URL"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🔧 Next steps:"
echo "1. Wait for node sync (if using local nodes)"
echo "2. Test RPC connection: npm run test-rpc (in backend directory)"
echo "3. Start your backend application"
echo ""
echo "📚 Documentation: See docs/rpc/doc.md for detailed information"