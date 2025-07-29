#!/bin/bash

# AI Assistant Helper Script for LRE Manager
# Source this script to get helpful aliases and functions

echo "Loading AI Assistant Helper Script..."

# Set environment variables
export PAGER=cat
export TERM=xterm-256color

# Disable flow control
stty -ixon

# Helper functions for AI assistants
build_check() {
    echo "Running frontend build check..."
    cd frontend && npm run build
    echo "Running backend build check..."
    cd ../backend && npm run build
    cd ..
}

type_check() {
    echo "Running TypeScript type check..."
    cd frontend && npx tsc --noEmit
    cd ../backend && npx tsc --noEmit
    cd ..
}

test_all() {
    echo "Running frontend tests..."
    cd frontend && npm test
    echo "Running backend tests..."
    cd ../backend && npm test
    cd ..
}

# Aliases for common commands
alias gitlog='git log | cat'
alias gitdiff='git diff | cat'
alias lesscat='less | cat'
alias morecat='more | cat'
alias headcat='head | cat'
alias tailcat='tail | cat'

# Docker helpers
alias dlogs='docker logs | cat'
alias dcompose='docker-compose -f docker/docker-compose.dev.yml'

echo "AI Assistant Helper loaded!"
echo "Available functions: build_check, type_check, test_all"
echo "Available aliases: gitlog, gitdiff, lesscat, morecat, headcat, tailcat, dlogs, dcompose"