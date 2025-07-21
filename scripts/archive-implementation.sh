#!/bin/bash

# Archive Implementation Plan Script
# Usage: ./scripts/archive-implementation.sh <feature-name> <completion-date> <effort-weeks>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if required arguments are provided
if [ $# -lt 3 ]; then
    print_error "Usage: $0 <feature-name> <completion-date> <effort-weeks>"
    print_error "Example: $0 'vendor-management' '2024-03-15' '4'"
    exit 1
fi

FEATURE_NAME=$1
COMPLETION_DATE=$2
EFFORT_WEEKS=$3

# Extract year and quarter from completion date
YEAR=$(date -d "$COMPLETION_DATE" +%Y)
MONTH=$(date -d "$COMPLETION_DATE" +%m)
QUARTER=$(( (MONTH - 1) / 3 + 1 ))

print_header "Archiving Implementation Plan: $FEATURE_NAME"

# Check if implementation plan exists
PLAN_FILE="docs/implementation-plans/${FEATURE_NAME}.md"
if [ ! -f "$PLAN_FILE" ]; then
    print_error "Implementation plan not found: $PLAN_FILE"
    exit 1
fi

# Create archive directory structure
ARCHIVE_DIR="docs/implementation-plans/archive/${YEAR}/Q${QUARTER}"
mkdir -p "$ARCHIVE_DIR"

print_status "Created archive directory: $ARCHIVE_DIR"

# Update the implementation plan with completion status
print_status "Updating implementation plan with completion status..."

# Create a backup of the original file
cp "$PLAN_FILE" "${PLAN_FILE}.backup"

# Update the status in the plan
sed -i "s/^.*Status.*$/  - **Status**: ✅ **COMPLETED** - $COMPLETION_DATE/" "$PLAN_FILE"
sed -i "s/^.*Estimated Effort.*$/  - **Final Effort**: $EFFORT_WEEKS weeks/" "$PLAN_FILE"

# Add implementation summary section if it doesn't exist
if ! grep -q "## Implementation Summary" "$PLAN_FILE"; then
    cat >> "$PLAN_FILE" << EOF

## Implementation Summary
- **Start Date**: [To be filled]
- **Completion Date**: $COMPLETION_DATE
- **Actual Effort**: $EFFORT_WEEKS weeks
- **Team Members**: [To be filled]
- **Key Achievements**: [To be filled]
- **Lessons Learned**: [To be filled]

## Final Status
- [x] All requirements implemented
- [x] All acceptance criteria met
- [x] Testing completed
- [x] Documentation updated
- [x] Code reviewed and approved
EOF
fi

# Move the plan to archive
ARCHIVE_FILE="$ARCHIVE_DIR/${FEATURE_NAME}.md"
mv "$PLAN_FILE" "$ARCHIVE_FILE"

print_status "Moved implementation plan to: $ARCHIVE_FILE"

# Update the archive README
ARCHIVE_README="docs/implementation-plans/archive/README.md"
if [ -f "$ARCHIVE_README" ]; then
    print_status "Updating archive README..."
    
    # Add entry to the appropriate quarter section
    QUARTER_SECTION="### ${YEAR} Q${QUARTER}"
    
    if ! grep -q "$QUARTER_SECTION" "$ARCHIVE_README"; then
        # Add new quarter section
        sed -i "/## Archive Index/a\\
\\
$QUARTER_SECTION\\
- **$FEATURE_NAME** - Completed $(date -d "$COMPLETION_DATE" +"%B %Y")\\
  - [$FEATURE_NAME.md](${YEAR}/Q${QUARTER}/${FEATURE_NAME}.md)\\
  - Effort: $EFFORT_WEEKS weeks\\
  - Team: Development Team\\
  - Key Features: [To be filled]" "$ARCHIVE_README"
    else
        # Add to existing quarter section
        sed -i "/$QUARTER_SECTION/a\\
- **$FEATURE_NAME** - Completed $(date -d "$COMPLETION_DATE" +"%B %Y")\\
  - [$FEATURE_NAME.md](${YEAR}/Q${QUARTER}/${FEATURE_NAME}.md)\\
  - Effort: $EFFORT_WEEKS weeks\\
  - Team: Development Team\\
  - Key Features: [To be filled]" "$ARCHIVE_README"
    fi
fi

# Update the main implementation plans README
MAIN_README="docs/implementation-plans/README.md"
if [ -f "$MAIN_README" ]; then
    print_status "Updating main implementation plans README..."
    
    # Update the status table to show archived
    sed -i "s/| $FEATURE_NAME | .* | .* | .* | .* |/| $FEATURE_NAME | Completed | [Priority] | $EFFORT_WEEKS weeks | ✅ Archived |/" "$MAIN_README"
fi

# Clean up backup file
rm -f "${PLAN_FILE}.backup"

print_header "Archive Process Complete!"

print_status "Next steps:"
echo "1. Review and update the archived implementation plan: $ARCHIVE_FILE"
echo "2. Update docs/FEATURES.md to mark the feature as completed"
echo "3. Update TODO.md to mark related tasks as completed"
echo "4. Commit the changes with a descriptive message"
echo ""
echo "Example commit message:"
echo "git add . && git commit -m \"Archive completed $FEATURE_NAME implementation plan\""

print_warning "Remember to:"
echo "- Fill in the implementation summary details"
echo "- Update any references to this feature in other documentation"
echo "- Remove any sprint plans that reference this feature" 