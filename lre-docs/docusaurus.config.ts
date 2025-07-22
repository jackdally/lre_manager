import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'LRE Manager',
  tagline: 'Latest Revised Estimate Management System',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://jackdally.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/lre_manager/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'jackdally', // Usually your GitHub org/user name.
  projectName: 'lre_manager', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/jackdally/lre_manager/tree/main/lre-docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/jackdally/lre_manager/tree/main/lre-docs/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/lre-manager-social-card.jpg',
    navbar: {
      title: 'LRE Manager',
      logo: {
        alt: 'LRE Manager Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'features',
          position: 'left',
          label: 'Features',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tasks',
          position: 'left',
          label: 'Tasks',
        },
        {
          type: 'docSidebar',
          sidebarId: 'implementation',
          position: 'left',
          label: 'Implementation',
        },
        {to: '/blog', label: 'Updates', position: 'left'},
        {
          href: 'https://github.com/jackdally/lre_manager',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Features',
              to: '/docs/features',
            },
            {
              label: 'Project Management',
              to: '/docs/project-management',
            },
          ],
        },
        {
          title: 'Development',
          items: [
            {
              label: 'Task Management',
              to: '/docs/tasks',
            },
            {
              label: 'Implementation Plans',
              to: '/docs/implementation-plans',
            },
            {
              label: 'Feature Development',
              to: '/docs/feature-development-checklist',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Updates',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/jackdally/lre_manager',
            },
            {
              label: 'Issues',
              href: 'https://github.com/jackdally/lre_manager/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} LRE Manager. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
