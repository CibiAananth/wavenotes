// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  printWidth: 80,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  quoteProps: 'as-needed',
  arrowParens: 'avoid',

  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '',
    '^types$',
    '^@/types/(.*)$',
    '^@/config/(.*)$',
    '^@/router/(.*)$',
    '^@/lib/(.*)$',
    '',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript'],

  plugins: ['@ianvs/prettier-plugin-sort-imports'],
};
