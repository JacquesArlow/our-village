#!/usr/bin/env bash
# register-cloud-runner.sh
# Run this ONCE on cloud (20.0.2.104) to register a self-hosted GitHub Actions
# runner with the label 'cloud' for the JacquesArlow/our-wellness repo.
#
# Usage:
#   1. Get a registration token from GitHub:
#        gh api -XPOST repos/JacquesArlow/our-wellness/actions/runners/registration-token \
#          --jq .token > /tmp/gh-runner-token
#      (token lives ~1 hour)
#   2. scp this script + the token to cloud
#   3. ssh cloud 'sudo bash register-cloud-runner.sh /tmp/gh-runner-token our-wellness'
#
# After this, every push to main in our-wellness will auto-deploy.
set -euo pipefail

TOKEN_FILE="${1:-/tmp/gh-runner-token}"
RUNNER_NAME="${2:-our-wellness-cloud}"
REPO_DIR="${3:-/opt/our-wellness}"

if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "usage: $0 <token-file> [runner-name] [repo-dir]"
  echo "  token-file: path to a file containing the GH registration token"
  echo "  runner-name: label for this runner (default: our-wellness-cloud)"
  echo "  repo-dir: where the our-wellness repo is checked out (default: /opt/our-wellness)"
  exit 1
fi

TOKEN=$(cat "$TOKEN_FILE")
RUNNER_VERSION="2.319.1"

echo "==> Installing runner as user: $(whoami)"
echo "==> Runner name: $RUNNER_NAME"
echo "==> Repo dir: $REPO_DIR"

# Install deps
sudo apt-get update -qq
sudo apt-get install -y -qq curl jq git

# Create runner user + dir (if not already)
if ! id runner >/dev/null 2>&1; then
  sudo useradd -m -s /bin/bash runner
  echo "==> created user 'runner'"
fi

sudo mkdir -p /opt/actions-runner
sudo chown runner:runner /opt/actions-runner

# Download + extract runner
cd /opt/actions-runner
if [[ ! -f ./run.sh ]]; then
  sudo -u runner curl -fsSL -o runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz"
  sudo -u runner tar xzf runner.tar.gz
  sudo -u runner rm runner.tar.gz
  echo "==> runner v${RUNNER_VERSION} installed"
fi

# Configure
sudo -u runner ./config.sh \
  --unattended \
  --replace \
  --url "https://github.com/JacquesArlow/our-wellness" \
  --token "$TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "cloud,our-wellness,self-hosted,linux,arm64" \
  --work "_work"

# Install + start as a systemd service
sudo ./svc.sh install runner
sudo ./svc.sh start
echo "==> runner service installed and started"

# Verify
sleep 2
systemctl is-active actions.runner.*our-wellness.$RUNNER_NAME.service
echo "==> runner '$RUNNER_NAME' is live and registered with the cloud label"
echo ""
echo "Test it:"
echo "  gh workflow run deploy.yml --repo JacquesArlow/our-wellness"
