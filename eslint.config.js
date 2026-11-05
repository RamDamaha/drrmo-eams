import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['public/**', 'vendor/**', 'node_modules/**', 'storage/**', 'bootstrap/ssr/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
        },
    },
    prettier,
);
