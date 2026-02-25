# Antigravity 项目规则说明

本目录包含从 `.agent/rules/user_global.md` 转换而来的 Trae IDE 项目规则。

## 规则文件说明

| 文件 | 说明 |
|------|------|
| `.editorconfig` | 编辑器基础配置（缩进、换行、字符集等） |
| `.eslintrc.json` | JavaScript/TypeScript 代码规范（命名、注释、语法检查） |
| `.prettierrc` | 代码格式化配置 |

## 规则转换说明

### 已转换的规则

1. **命名规范**（对应原规则 6.1）
   - 变量/函数：camelCase
   - 类/组件：PascalCase
   - 常量：UPPER_SNAKE_CASE
   - 文件/目录：kebab-case（通过 ESLint 插件配置）

2. **缩进规范**
   - JavaScript/TypeScript：2 空格
   - Python：4 空格

3. **代码风格**
   - 使用单引号
   - 不使用分号
   - 最大行宽 100 字符
   - 使用 LF 换行符

### 未转换的规则（仅文档说明）

以下规则为工程管理类规范，不属于代码检查工具范畴，供参考：

1. **运行环境**：Ubuntu 20.04 + 1Panel + Docker
2. **容器化开发**：所有运行时在 Docker 容器内执行
3. **AI 行为准则**：
   - 仅修改代码文件
   - 依赖容器内热重载生效
   - 禁止在宿主 Shell 执行 Node.js/Python 命令
4. **语言要求**：强制简体中文（代码原文保留英文）

## 原始规则文件

原始规则见：`.agent/rules/user_global.md`（Antigravity 核心工程规则 v2.1）

## 注意事项

- 本规则主要适用于前端（React + TypeScript）和后端（Python）项目
- 如需为特定文件类型添加额外规则，请修改对应配置文件
- Python 项目的代码规范建议使用 `ruff` 或 `flake8` 补充
