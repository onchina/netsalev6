/**
 * ESLint 配置 - JavaScript/TypeScript 代码规范
 * 作用：代码语法检查、命名规范、代码质量检测
 * 来源：基于 .agent/rules/user_global.md 命名规范转换
 */

module.exports = {
  // 环境配置
  env: {
    browser: true,    // 浏览器环境
    es2021: true,    // ES2021 语法
    node: true       // Node.js 环境
  },

  // 继承的规则集
  extends: [
    'eslint:recommended',           // ESLint 推荐规则
    'plugin:react/recommended',     // React 推荐规则
    'plugin:@typescript-eslint/recommended'  // TypeScript 推荐规则
  ],

  // 解析器：TypeScript
  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaFeatures: {
      jsx: true                     // 支持 JSX 语法
    },
    ecmaVersion: 'latest',          // 最新 ECMAScript 版本
    sourceType: 'module'            // 模块类型
  },

  // 插件配置
  plugins: [
    'react',                        // React 相关规则
    '@typescript-eslint'            // TypeScript 相关规则
  ],

  // 规则配置
  rules: {
    // 命名规范 - 驼峰命名
    camelcase: ['error', {
      properties: 'always',
      ignoreDunderMarshaler: true
    }],

    // 构造函数首字母大写
    new-cap: ['error', {
      capIsNew: false,
      newIsCap: true
    }],

    // 不强制使用分号（与 Prettier 配合）
    semi: ['off'],

    // 未使用变量警告
    no-unused-vars: 'warn',

    // 控制台语句警告（生产环境应关闭）
    no-console: 'warn',

    // 优先使用 const
    "prefer-const": "warn",

    // 必须使用 === 和 !==
    eqeqeq: ['error', 'always'],

    // 必须使用大括号包裹代码块
    curly: ['error', 'all'],

    // 禁止连续空行（最多1行）
    no-multiple-empty-lines: ['error', { max: 1, maxEOF: 1 }],

    // 禁止行尾空格
    no-trailing-spaces: 'error',

    // 注释必须带空格
    spaced-comment: ['error', 'always', {
      line: { markers: ['/'], exceptions: ['-', '+'] }
    }],

    // TypeScript 命名规范（来自原规则 6.1）
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'default', format: ['camelCase'] },
      { selector: 'variable', format: ['camelCase', 'UPPER_SNAKE_CASE'] },
      { selector: 'function', format: ['camelCase', 'PascalCase'] },
      { selector: 'class', format: ['PascalCase'] },
      { selector: 'interface', format: ['PascalCase'] },
      { selector: 'typeAlias', format: ['PascalCase'] },
      { selector: 'enum', format: ['PascalCase', 'UPPER_SNAKE_CASE'] },
      { selector: 'constant', format: ['UPPER_SNAKE_CASE'] },
      { selector: 'property', format: ['camelCase', 'PascalCase'] }
    ],

    // 关闭显式返回类型要求（过于严格）
    '@typescript-eslint/explicit-function-return-type': 'off',

    // any 类型警告
    '@typescript-eslint/no-explicit-any': 'warn',

    // 未使用变量警告（忽略下划线开头）
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // React 相关配置
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  }
};
