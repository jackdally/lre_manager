#!/bin/bash

# Fix Markdown numbered lists for Docusaurus compatibility
# This script fixes various patterns of numbered lists to prevent JSX interpretation

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "lre-docs/docs" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

print_status "Fixing numbered lists and HTML-like characters in Markdown files..."

# Find all markdown files and fix numbered lists
find lre-docs/docs -name "*.md" -type f | while read -r file; do
    print_status "Processing: $file"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file with multiple patterns:
    # 1. Add space before numbered lists that start at beginning of line
    # 2. Fix numbered lists in bold text (e.g., **Risk 1**:)
    # 3. Fix numbered lists in other contexts
    # 4. Fix numbered section headers (e.g., ## 1. Preparation)
    # 5. Fix numbered lists with spaces at beginning
    # 6. Fix HTML-like characters that cause JSX interpretation issues
    
    sed -e 's/^\([0-9]\+\.\)/ \1/g' \
        -e 's/\*\*\([A-Za-z]\+ [0-9]\+\)\*\*:/**\1** -/g' \
        -e 's/^[[:space:]]*[0-9]\+\./ -/g' \
        -e 's/^## [0-9]\+\. /## /g' \
        -e 's/^### [0-9]\+\. /### /g' \
        -e 's/^#### [0-9]\+\. /#### /g' \
        -e 's/<\([0-9]\+\)/&lt;\1/g' \
        "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
    
    print_success "Fixed: $file"
done

print_success "All Markdown files processed!"
print_status "You can now try building the documentation again." 