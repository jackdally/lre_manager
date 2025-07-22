# Risk Register

## [2024-06-09] High Severity Vulnerability in xlsx (SheetJS)

- **Component:** backend (Excel/CSV import feature)
- **Package:** xlsx
- **Severity:** High
- **Description:** Prototype Pollution and Regular Expression Denial of Service (ReDoS) vulnerabilities in SheetJS/xlsx. No fix available as of this date.
- **References:**
  - [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
  - [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)
- **Current Mitigation:** Import feature is restricted to internal/admin use only. File uploads are validated for type and size.
- **Planned Review:** 2024-09-01 (or when SheetJS releases a fix) 