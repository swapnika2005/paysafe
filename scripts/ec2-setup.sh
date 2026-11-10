#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting EC2 instance setup..."

# 1. Update installed packages and package index
echo "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install essential tools (Git, curl, unzip)
echo "Installing Git, curl, and unzip..."
sudo apt-get install -y git curl unzip apt-transport-https ca-certificates gnupg lsb-release

# 3. Install Docker
echo "Installing Docker..."
# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Start Docker and enable it on boot
echo "Starting and enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# 5. Add current user to the Docker group
echo "Adding current user ($USER) to the docker group..."
sudo usermod -aG docker $USER

# 6. Install Docker Compose (standalone just in case, though plugin is installed above)
echo "Installing Docker Compose standalone..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "------------------------------------------------------"
echo "Setup complete! ✅"
echo "Git version: $(git --version)"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo "------------------------------------------------------"
echo "⚠️ IMPORTANT: You must log out and log back in (or run 'newgrp docker') for the Docker group changes to take effect!"
