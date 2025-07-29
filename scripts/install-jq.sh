#!/bin/bash

# Install jq for JSON processing
# This script installs jq on various operating systems

echo "Installing jq for JSON processing..."

# Detect operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        echo "Installing jq via apt-get..."
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        echo "Installing jq via yum..."
        sudo yum install -y jq
    elif command -v dnf &> /dev/null; then
        # Fedora
        echo "Installing jq via dnf..."
        sudo dnf install -y jq
    elif command -v pacman &> /dev/null; then
        # Arch Linux
        echo "Installing jq via pacman..."
        sudo pacman -S jq
    else
        echo "Could not detect package manager. Please install jq manually."
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        echo "Installing jq via Homebrew..."
        brew install jq
    else
        echo "Homebrew not found. Please install Homebrew first or install jq manually."
        exit 1
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash, Cygwin)
    echo "On Windows, please install jq manually or use Chocolatey: choco install jq"
    exit 1
else
    echo "Unsupported operating system: $OSTYPE"
    echo "Please install jq manually from https://stedolan.github.io/jq/download/"
    exit 1
fi

# Verify installation
if command -v jq &> /dev/null; then
    echo "✅ jq installed successfully!"
    echo "Version: $(jq --version)"
else
    echo "❌ jq installation failed. Please install manually."
    exit 1
fi 