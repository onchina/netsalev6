/**
 * Prettier 配置 - 代码格式化
 * 作用：自动格式化代码（缩进、引号、分号、换行等）
 * 来源：基于 .agent/rules/user_global.md 代码风格转换
 */

module.exports = {
  // 不使用分号
  semi: false,

  // 使用单引号
  singleQuote: true,

  // 缩进宽度：2 空格
  tabWidth: 2,

  // 不使用 Tab
  useTabs: false,

  // 最大行宽：100 字符
  printWidth: 100,

  // trailing comma：ES5 风格
  trailingComma: 'es5',

  // 对象括号内空格
  bracketSpacing: true,

  // JSX 不使用单引号
  jsxSingleQuote: false,

  // 箭头函数参数始终带括号
  arrowParens: 'always',

  // 换行符：LF
  endOfLine: 'lf',

  // Vue 文件缩进
  vueIndentScriptAndStyle: false
};
