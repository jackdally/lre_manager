import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

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

  // Features sidebar
  features: [
    {
      type: 'doc',
      id: 'FEATURES',
      label: 'Feature Roadmap',
    },
    {
      type: 'category',
      label: 'In Progress',
      items: [
        'implementation-plans/user-preferences',
        'implementation-plans/boe-system',
      ],
    },
    // Planned Features category removed - will be added when features are ready
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

  // Tasks sidebar
  tasks: [
    {
      type: 'category',
      label: 'Task Management',
      items: [
        'tasks/README',
      ],
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

  // Implementation sidebar
  implementation: [
    {
      type: 'category',
      label: 'Implementation Plans',
      items: [
        'implementation-plans/README',
        'implementation-plans/user-preferences',
        'implementation-plans/boe-system',
      ],
    },
    {
      type: 'category',
      label: 'Sprint Planning',
      items: [
        'sprints/sprint-template',
        'sprints/sprint-1-user-preferences',
        'sprints/sprint-2-boe-phase1',
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
};

export default sidebars;
