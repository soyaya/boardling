#!/bin/bash

echo "🔍 Network Connectivity Check"
echo "============================="

# Test basic connectivity
echo "📡 Testing basic connectivity..."

if ping -c 1 8.8.8.8 &> /dev/null; then
    echo "✅ Internet connectivity: OK"
else
    echo "❌ Internet connectivity: FAILED"
    echo "   Check your network connection"
    exit 1
fi

# Test DNS resolution
echo "🌐 Testing DNS resolution..."
if nslookup github.com &> /dev/null; then
    echo "✅ DNS resolution: OK"
else
    echo "❌ DNS resolution: FAILED"
    echo "   Try using different DNS servers (8.8.8.8, 1.1.1.1)"
fi

# Test HTTPS connectivity
echo "🔒 Testing HTTPS connectivity..."

sites=("github.com" "crates.io" "api.github.com")
for site in "${sites[@]}"; do
    if curl -I "https://$site" --connect-timeout 10 &> /dev/null; then
        echo "✅ $site: OK"
    else
        echo "❌ $site: FAILED"
        
        # Check if it's a proxy issue
        if curl -I "http://$site" --connect-timeout 10 &> /dev/null; then
            echo "   💡 HTTP works but HTTPS fails - possible proxy/firewall issue"
        fi
    fi
done

# Check for proxy settings
echo "🔧 Checking proxy configuration..."
if [ -n "$http_proxy" ] || [ -n "$https_proxy" ] || [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ]; then
    echo "✅ Proxy environment variables found:"
    [ -n "$http_proxy" ] && echo "   http_proxy: $http_proxy"
    [ -n "$https_proxy" ] && echo "   https_proxy: $https_proxy"
    [ -n "$HTTP_PROXY" ] && echo "   HTTP_PROXY: $HTTP_PROXY"
    [ -n "$HTTPS_PROXY" ] && echo "   HTTPS_PROXY: $HTTPS_PROXY"
else
    echo "ℹ️  No proxy environment variables set"
fi

# Check cargo configuration
echo "🦀 Checking Cargo configuration..."
if [ -f ~/.cargo/config.toml ]; then
    echo "✅ Cargo config found at ~/.cargo/config.toml"
    if grep -q "proxy" ~/.cargo/config.toml; then
        echo "   📋 Proxy configuration detected in cargo config"
    fi
else
    echo "ℹ️  No cargo config found"
fi

echo ""
echo "🔧 Troubleshooting Suggestions:"
echo "==============================="

if ! curl -I "https://crates.io" --connect-timeout 10 &> /dev/null; then
    echo "❌ Cannot reach crates.io - this will prevent Rust builds"
    echo ""
    echo "💡 Possible solutions:"
    echo "   1. Configure proxy if you're behind corporate firewall:"
    echo "      export https_proxy=your-proxy:port"
    echo "      export http_proxy=your-proxy:port"
    echo ""
    echo "   2. Use alternative cargo registry:"
    echo "      Add to ~/.cargo/config.toml:"
    echo "      [source.crates-io]"
    echo "      replace-with = 'mirror'"
    echo "      [source.mirror]"
    echo "      registry = 'https://mirrors.ustc.edu.cn/crates.io-index'"
    echo ""
    echo "   3. Use VPN or mobile hotspot temporarily"
    echo ""
    echo "   4. Download pre-built binaries manually"
fi

if ! curl -I "https://github.com" --connect-timeout 10 &> /dev/null; then
    echo "❌ Cannot reach GitHub - this will prevent git operations"
    echo "💡 Try using GitHub's SSH instead of HTTPS"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Fix network connectivity issues above"
echo "2. Run: ./quick-install-zcash.sh (if network is fixed)"
echo "3. Or manually download zcashd binary and follow ZCASH_SETUP_FINAL.md"