#!/bin/bash

# Set PAGER to cat to prevent hanging on commands like git log
export PAGER=cat

# Set TERM for better terminal compatibility
export TERM=xterm-256color

# Disable flow control (Ctrl+S/Ctrl+Q)
stty -ixon

# Set some helpful aliases
alias less='less -R'
alias more='more -R'

# Ensure we're in the right directory
cd /home/jac/lre_manager_take2

echo "Shell configuration loaded. PAGER set to 'cat' to prevent hanging."