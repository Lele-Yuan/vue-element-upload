/* eslint-disable */
module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: "vue-eslint-parser",
    parserOptions:{
        parser: "@typescript-eslint/parser"
    },
    plugins: ['vue', '@typescript-eslint'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'semi': ['error', 'always'],
        '@typescript-eslint/semi': ['error', 'always'],
        'indent': ['error', 4],
        '@typescript-eslint/indent': ['error', 4],
        "vue/html-indent": ["error", 4],
        '@typescript-eslint/no-namespace': 'off',
        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-var-requires': 0,
        'no-useless-escape': 'off',
        'space-before-function-paren': 'off',
        'quote-props': 'warn',
        'require-direct-export': 'off',
        'vue/require-direct-export': 'off',
        'no-eval': 'off',
        'quote-props': 'off'
    }
};
