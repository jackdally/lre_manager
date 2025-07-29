import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docs: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'SETUP',
        'ARCHITECTURE',
        'API_EXAMPLES',
        'IMPORT_FEATURE',
        'FAQ',
      ],
    },
    {
      type: 'category',
      label: 'Project Management',
      items: [
        'PROJECT_MANAGEMENT',
        'FEATURE_DEVELOPMENT_CHECKLIST',
        'PROJECT_ORGANIZATION_SUMMARY',
        'TASK_MANAGEMENT_SUMMARY',
      ],
    },
  ],

  // Consolidated Features & Implementation sidebar
  features: [
    {
      type: 'doc',
      id: 'FEATURES',
      label: 'Feature Roadmap',
    },
    {
      type: 'category',
      label: 'Cross-Cutting',
      items: [
        'tasks/active/bugs',
        'tasks/active/general',
      ],
    },
    {
      type: 'category',
      label: 'Active Features',
      items: [
        {
          type: 'category',
          label: 'BOE System',
          items: [
            'implementation-plans/boe-system',
            'tasks/active/boe-system',
          ],
        },
        {
          type: 'category',
          label: 'Risk & Opportunity System',
          items: [
            'implementation-plans/risk-opportunity-system',
            'tasks/active/risk-opportunity-system',
          ],
        },
        {
          type: 'category',
          label: 'User Preferences',
          items: [
            'implementation-plans/user-preferences',
            'tasks/active/user-preferences',
          ],
        },
        {
          type: 'category',
          label: 'Transaction Matching Upgrades',
          items: [
            'implementation-plans/transaction-matching-upgrades',
            'tasks/active/transaction-matching-upgrades',
          ],
        },
        {
          type: 'category',
          label: 'Multi-Currency',
          items: [
            'tasks/active/multi-currency',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Completed Features',
      items: [
        'implementation-plans/archive/2025/Q3/vendor-management',
        'implementation-plans/archive/2025/Q3/netsuite-actuals-upload',
        'implementation-plans/archive/2025/Q3/settings-configuration',
        'implementation-plans/archive/2025/Q3/ledger-management',
        'implementation-plans/archive/2025/Q3/program-management',
      ],
    },
  ],

  // Legacy sidebars - keeping for reference but not using
  // These can be removed after confirming the new structure works
  /*
  tasks: [
    {
      type: 'doc',
      id: 'tasks/README',
      label: 'Task Management',
    },
    {
      type: 'category',
      label: 'Active Tasks',
      items: [
        'tasks/active/bugs',
        'tasks/active/general',
        'tasks/active/user-preferences',
        'tasks/active/multi-currency',
        'tasks/active/boe-system',
        'tasks/active/risk-opportunity-system',
      ],
    },
    {
      type: 'category',
      label: 'Completed Tasks',
      items: [
        'tasks/completed/vendor-management',
        'tasks/completed/netsuite-actuals-upload',
        'tasks/completed/settings-configuration',
        'tasks/completed/ledger-management',
        'tasks/completed/program-management',
      ],
    },
  ],

  implementation: [
    {
      type: 'doc',
      id: 'implementation-plans/README',
      label: 'Implementation Plans',
    },
    {
      type: 'category',
      label: 'Active Plans',
      items: [
        'implementation-plans/user-preferences',
        'implementation-plans/boe-system',
        'implementation-plans/risk-opportunity-system',
      ],
    },
    {
      type: 'category',
      label: 'Archived Plans',
      items: [
        'implementation-plans/archive/README',
        {
          type: 'category',
          label: 'Q3 2025',
          items: [
            'implementation-plans/archive/2025/Q3/vendor-management',
            'implementation-plans/archive/2025/Q3/netsuite-actuals-upload',
            'implementation-plans/archive/2025/Q3/settings-configuration',
            'implementation-plans/archive/2025/Q3/ledger-management',
            'implementation-plans/archive/2025/Q3/program-management',
          ],
        },
      ],
    },
  ],
  */
};

export default sidebars;
