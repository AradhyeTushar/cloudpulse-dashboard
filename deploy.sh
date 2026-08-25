#!/usr/bin/env bash
set -e

echo "============================================================"
echo "🚀 CloudPulse Automated VPS Production Deployment"
echo "============================================================"

# 1. Update and install required dependencies
echo "📦 Step 1: Checking system packages and Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    systemctl enable --now docker
else
    echo "✅ Docker is already installed: $(docker --version)"
fi

if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose Plugin..."
    apt-get update -y && apt-get install -y docker-compose-plugin git curl || true
fi

# 2. Add IDE SSH Key for seamless remote management
mkdir -p ~/.ssh && chmod 700 ~/.ssh
SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJmkhipl9ml8AlZWElv1BMj2w+So2qjmZDNVK4Vt8QHI tushar0p@tushar0p-fedora"
if ! grep -q "tushar0p@tushar0p-fedora" ~/.ssh/authorized_keys 2>/dev/null; then
    echo "$SSH_KEY" >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo "✅ SSH Key added to authorized_keys."
fi

# 3. Clone or pull the latest CloudPulse repository
APP_DIR="/root/cloudpulse-dashboard"
if [ -d "$APP_DIR/.git" ]; then
    echo "🔄 Step 2: Pulling latest changes into $APP_DIR..."
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    echo "📥 Step 2: Cloning repository into $APP_DIR..."
    git clone https://github.com/AradhyeTushar/cloudpulse-dashboard.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 4. Configure Firewall (if ufw is present)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo "🛡️ Configuring UFW Firewall ports..."
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw allow 8000/tcp || true
    ufw allow 5173/tcp || true
fi

# 5. Build and launch all production containers
echo "🐳 Step 3: Launching CloudPulse containers via Docker Compose..."
docker compose up -d --build

# 6. Wait for health check
echo "⏳ Waiting for services to initialize..."
sleep 5

SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo ""
echo "============================================================"
echo "🎉 CLOUDPULSE VPS DEPLOYMENT SUCCESSFUL!"
echo "============================================================"
echo ""
echo "🌐 Web Dashboard:    http://$SERVER_IP:5173"
echo "🌐 Public Tunnel:    https://cloudpulse.devtushar.uk"
echo "⚡ Proxy Port:       $SERVER_IP:8000"
echo ""
echo "🧪 Test Proxy Command:"
echo "curl --proxy \"http://cp_1638ac43:p_sec_0068cfdb54424bbf@$SERVER_IP:8000\" http://ip-api.com/json"
echo ""
echo "============================================================"
