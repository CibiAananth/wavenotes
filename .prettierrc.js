// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  printWidth: 80,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  arrowParens: 'avoid',
  htmlWhitespaceSensitivity: 'ignore',

  importOrder: [
    '^(react/(.*)$)|^(react-(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next-(.*)$)|^(next$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '^types$',
    '^@/types/(.*)$',
    '^@/config/(.*)$',
    '^@/router/(.*)$',
    '^@/context/(.*)$',
    '^@/lib/(.*)$',
    '^@/hooks/(.*)$',
    '^@/components/ui/(.*)$',
    '^@/components/(.*)$',
    '^@/assets/(.*)$',
    '^@/styles/(.*)$',
    '^@/app/(.*)$',
    '',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],

  tailwindConfig: './apps/app/tailwind.config.js',
  tailwindFunctions: ['clsx', 'cva', 'tw'],

  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  pluginSearchDirs: false, // needed for tailwindcss plugin
};
