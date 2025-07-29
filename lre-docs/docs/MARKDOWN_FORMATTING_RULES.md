# Markdown Formatting Rules for Docusaurus

## Overview
This document defines the formatting rules and best practices for markdown files in the LRE Manager documentation to prevent MDX compilation errors and ensure consistent formatting.

## 🚨 Critical MDX Rules

### 1. **List Item Formatting**
**❌ WRONG** - Causes MDX parsing errors:
```markdown
- [ ] **Task**: Implement approval notifications
- [ ] **Task**: Add comprehensive error handling
```

**✅ CORRECT** - Use descriptive text instead of numbers:
```markdown
- [ ] **Task**: Implement approval notifications
- [ ] **Task**: Add comprehensive error handling
```

**✅ ALTERNATIVE** - Use proper markdown list formatting:
```markdown
- [ ] **Task**: Implement approval notifications
- [ ] **Task**: Add comprehensive error handling
```

### 2. **Code Blocks and Inline Code**
**❌ WRONG** - Can cause parsing issues:
```markdown
Use `$variable` in your code
```

**✅ CORRECT** - Escape special characters:
```markdown
Use `\$variable` in your code
```

### 3. **Special Characters in Headers**
**❌ WRONG** - Special characters in headers:
```markdown
## API Endpoints & Routes
## User Management (v2.0)
```

**✅ CORRECT** - Use simple headers:
```markdown
## API Endpoints and Routes
## User Management v2.0
```

## 📝 General Formatting Rules

### Headers
- Use `#` for main title (only one per document)
- Use `##` for major sections
- Use `###` for subsections
- Use `####` for minor subsections
- **Never use more than 4 levels deep**

### Lists
- Use `-` for unordered lists
- Use `1.` for ordered lists
- Indent sub-lists with 2 spaces
- **Never start list items with numbers followed by periods**

### Code Blocks
```markdown
```javascript
// Use triple backticks with language specification
const example = "code";
```
```

### Inline Code
```markdown
Use `backticks` for inline code
```

### Links
```markdown
[Link Text](url)
[Internal Link](relative/path.md)
```

### Images
```markdown
![Alt Text](image-path.png)
```

### Bold and Italic
```markdown
**Bold text**
*Italic text*
***Bold and italic***
```

### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

## 🔧 MDX-Specific Rules

### 1. **Avoid Special Characters in Content**
- Don't use `{`, `}`, `<`, `>` in regular text
- Escape them if needed: `\{`, `\}`, `\<`, `\>`

### 2. **Component Usage**
```markdown
import MyComponent from '@site/src/components/MyComponent';

<MyComponent prop="value" />
```

### 3. **Admonitions**
```markdown
:::tip
This is a tip
:::

:::warning
This is a warning
:::

:::danger
This is a danger
:::

:::info
This is info
:::
```

## 🚫 Common Pitfalls to Avoid

### 1. **Numbered Task Lists**
**❌ WRONG**:
```markdown
- [ ] **Task**: Do something
- [ ] **Task**: Do something else
```

**✅ CORRECT**:
```markdown
- [ ] **Task**: Do something
- [ ] **Task**: Do something else
```

### 2. **Special Characters in Headers**
**❌ WRONG**:
```markdown
## API & Routes
## User Management (v2.0)
```

**✅ CORRECT**:
```markdown
## API and Routes
## User Management v2.0
```

### 3. **Unescaped Characters**
**❌ WRONG**:
```markdown
Use $variable in your code
```

**✅ CORRECT**:
```markdown
Use \$variable in your code
```

## ⚠️ Angle Brackets and MDX Errors

- **Never use angle brackets (`<`, `>`) in plain text** unless you are intentionally writing JSX or HTML.
- MDX will interpret anything inside `<...>` as a JSX tag, which will cause errors if it is not valid JSX.
- **Example of what NOT to do:**
  - [ ] Calculations update in real-time (&lt;500ms)
- **How to fix:**
  - Use plain text: `(less than 500ms)`
  - Or use backticks: `` (`&lt;500ms&gt;`) ``
  - Or use HTML entities: `(&lt;500ms&gt;)`

**If you see an error like:**
```
Unexpected character `5` (U+0035) before name, expected a character that can start a name, such as a letter, `$`, or `_`
```
**Check for angle brackets in your markdown and replace them as shown above.**

## 🛠️ Validation Tools

### Pre-commit Hook
Add this to your `.husky/pre-commit`:
```bash
#!/bin/sh
# Validate markdown files
npx markdownlint "lre-docs/docs/**/*.md"
```

### VS Code Extensions
- **markdownlint** - Markdown linting
- **Markdown All in One** - Enhanced markdown support
- **Docusaurus** - Docusaurus-specific support

## 📋 Checklist Before Committing

- [ ] No numbered task lists (use descriptive text instead)
- [ ] No special characters in headers
- [ ] All code blocks have language specification
- [ ] All links are valid and working
- [ ] No unescaped special characters
- [ ] Proper indentation in lists
- [ ] Consistent header hierarchy

## 🔍 Common Error Patterns

### MDX Parsing Errors
```
Unexpected character `5` (U+0035) before name
```
**Solution**: Remove numbers from task list items

### Image Not Found
```
Image docs/screenshots/image.png used in file.md not found
```
**Solution**: Comment out missing images or add placeholder

### Invalid Link
```
Invalid link: [text](broken-link)
```
**Solution**: Fix or remove broken links

## 📚 Examples

### Good Implementation Plan Structure
```markdown
# Feature Implementation Plan

## Overview
Brief description of the feature

## Requirements
- [ ] **Requirement**: Description
- [ ] **Requirement**: Description

## Architecture
### Backend Changes
- [ ] **Component**: Description
- [ ] **Component**: Description

### Frontend Changes
- [ ] **Component**: Description
- [ ] **Component**: Description

## Testing Strategy
- [ ] **Unit Tests**: Description
- [ ] **Integration Tests**: Description

## Success Criteria
- [ ] **Functional**: Description
- [ ] **Performance**: Description
```

## 🆘 Troubleshooting

If you encounter MDX compilation errors:

1. **Check the error line number** in the error message
2. **Look for numbered lists** or special characters
3. **Validate markdown syntax** using markdownlint
4. **Test locally** before committing
5. **Use the formatting rules** above as a guide

## 📞 Getting Help

- Check this document first
- Use markdownlint for validation
- Test changes locally with `npm run start` in lre-docs
- Ask for review if unsure about formatting

---

*Last updated: [Current Date]*
*Version: 1.0* 