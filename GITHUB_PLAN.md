# 项目托管到 GitHub 计划

## 一、需要忽略的文件和目录

### 1. 压缩包文件（不提交）
```
*.zip
*.tar
*.tar.gz
```

### 2. 日志文件（不提交）
```
*.log
logs/
```

### 3. 临时文件和备份
```
*.bak
*.tmp
*.swp
*~
.DS_Store
Thumbs.db
```

### 4. 依赖目录（使用包管理器管理）
```
node_modules/
__pycache__/
*.pyc
*.pyo
.pytest_cache/
venv/
env/
.venv/
```

### 5. 环境配置（敏感信息）
```
.env
.env.local
.env.*.local
*.pem
*.key
```

### 6. 容器相关文件（可选）
```
.dockerignore
Dockerfile
docker-compose.override.yml
```

### 7. IDE 配置（可选）
```
.idea/
.vscode/
*.sublime-*
```

## 二、执行步骤

### 步骤 1: 创建 .gitignore 文件
创建符合项目需求的 .gitignore 文件

### 步骤 2: 初始化 Git 仓库
```bash
git init
git config user.name "你的名字"
git config user.email "你的邮箱"
```

### 步骤 3: 添加文件并提交
```bash
git add .
git commit -m "Initial commit"
```

### 步骤 4: 创建 GitHub 远程仓库
在 GitHub 网站上创建新的远程仓库

### 步骤 5: 关联并推送
```bash
git remote add origin https://github.com/用户名/仓库名.git
git push -u origin master
```

## 三、保留上传的文件

| 文件/目录 | 说明 |
|-----------|------|
| backend/ | Python 后端代码 |
| frontend/ | React 前端代码 |
| .editorconfig | 编辑器配置 |
| .eslintrc.js | ESLint 配置 |
| .prettierrc.js | Prettier 配置 |
| ruff.toml | Python 规范配置 |
| .trae/ | Trae IDE 规则 |
| .agent/ | Agent 配置 |
| *.md | 项目文档 |

## 四、注意事项

1. 如果有 `.env` 文件包含敏感信息，确保已添加到 .gitignore
2. 首次提交不建议包含 node_modules，建议使用 `npm install` 重新安装
3. 如果后端有数据库配置，注意不要提交敏感的数据库密码
