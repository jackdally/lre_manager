#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -v, --verbose        Show detailed output"
    echo "  -f, --fix            Attempt to fix issues"
    exit 1
}

# Parse command line arguments
VERBOSE=false
FIX=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--fix)
            FIX=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$VERBOSE" = true ]; then
        echo -n "$message: "
        if [ "$status" = true ]; then
            echo "OK"
        else
            echo "FAILED"
        fi
    else
        if [ "$status" = false ]; then
            echo "ERROR: $message"
        fi
    fi
}

# Function to check command availability
check_command() {
    local cmd=$1
    local required=$2
    
    if command -v "$cmd" >/dev/null 2>&1; then
        print_status true "Command $cmd is available"
        if [ "$VERBOSE" = true ]; then
            echo "  Version: $($cmd --version 2>&1 | head -n 1)"
        fi
        return 0
    else
        print_status false "Command $cmd is not available"
        if [ "$required" = true ] && [ "$FIX" = true ]; then
            echo "  Attempting to install $cmd..."
            if [ "$cmd" = "docker" ]; then
                curl -fsSL https://get.docker.com -o get-docker.sh
                sudo sh get-docker.sh
            elif [ "$cmd" = "docker-compose" ]; then
                sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                sudo chmod +x /usr/local/bin/docker-compose
            elif [ "$cmd" = "node" ]; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif [ "$cmd" = "npm" ]; then
                sudo apt-get install -y npm
            elif [ "$cmd" = "git" ]; then
                sudo apt-get install -y git
            fi
        fi
        return 1
    fi
}

# Function to check port availability
check_port() {
    local port=$1
    local service=$2
    
    if ! nc -z localhost "$port" >/dev/null 2>&1; then
        print_status true "Port $port is available for $service"
        return 0
    else
        print_status false "Port $port is in use by $service"
        if [ "$FIX" = true ]; then
            echo "  Attempting to free port $port..."
            sudo lsof -i :"$port" | awk 'NR!=1 {print $2}' | xargs -r sudo kill -9
        fi
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local required_space=10 # GB
    local available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    
    if [ "$available_space" -ge "$required_space" ]; then
        print_status true "Sufficient disk space available ($available_space GB)"
        return 0
    else
        print_status false "Insufficient disk space (${available_space}GB available, ${required_space}GB required)"
        return 1
    fi
}

# Function to check memory
check_memory() {
    local required_memory=4 # GB
    local available_memory=$(free -g | awk '/^Mem:/{print $7}')
    
    if [ "$available_memory" -ge "$required_memory" ]; then
        print_status true "Sufficient memory available ($available_memory GB)"
        return 0
    else
        print_status false "Insufficient memory (${available_memory}GB available, ${required_memory}GB required)"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    if systemctl is-active --quiet docker; then
        print_status true "Docker service is running"
        return 0
    else
        print_status false "Docker service is not running"
        if [ "$FIX" = true ]; then
            echo "  Attempting to start Docker service..."
            sudo systemctl start docker
        fi
        return 1
    fi
}

# Function to check Docker permissions
check_docker_permissions() {
    if docker info >/dev/null 2>&1; then
        print_status true "User has Docker permissions"
        return 0
    else
        print_status false "User does not have Docker permissions"
        if [ "$FIX" = true ]; then
            echo "  Attempting to add user to docker group..."
            sudo usermod -aG docker "$USER"
            echo "  Please log out and log back in for changes to take effect"
        fi
        return 1
    fi
}

# Main execution
echo "Checking system requirements..."

# Check required commands
check_command "docker" true
check_command "docker-compose" true
check_command "node" true
check_command "npm" true
check_command "git" true

# Check port availability
check_port 3000 "Frontend"
check_port 4000 "Backend"
check_port 5432 "Database"

# Check system resources
check_disk_space
check_memory

# Check Docker
check_docker_service
check_docker_permissions

echo "System requirements check completed!" 