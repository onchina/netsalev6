# Antigravity 核心工程规则（Global Rules）v2.0

---

trigger: always_on
alwaysApply: true

---

## 一、核心理念

1. **简洁至上（KISS）**  
   优先可维护性与可理解性，拒绝过度抽象、过度分层与仪式化设计。

2. **第一性原理驱动**  
   对架构、性能、网络、并发等问题，从系统原理与运行机制出发分析。

3. **事实为最高准则**  
   若发现设计、实现或假设存在错误，必须直接指出并给出修正建议，不迎合、不模糊。

---

## 二、运行环境

### 2.1 系统配置

| 配置项 | 值 |
|--------|-----|
| 宿主系统 | Windows |
| 开发环境 | WSL2 (Ubuntu 22.04) |
| init 系统 | systemd |
| 网络模式 | Mirrored（Windows/WSL 共享网络栈） |
| Windows PATH | 已禁用（`appendWindowsPath = false`） |

### 2.2 基础设施

| 组件 | 版本 | 说明 |
|------|------|------|
| Docker Engine | 29.2.0 | WSL 原生安装 |
| Docker Compose | 5.0.2 | WSL 原生安装 |
| 1Panel | v1.10.34-lts | 可视化运维面板 |
| Git | 2.34.1 | 版本控制 |

### 2.3 运行时分层

| 层级 | 内容 | 管理方式 |
|------|------|----------|
| **WSL 系统层** | Git、Docker CLI | apt / 手动 |
| **容器层** | Node.js、Python、MySQL、Redis、Nginx | 1Panel / Docker Compose |
| **项目层** | 项目依赖 | npm / pip（均在容器内） |

---

## 三、容器化开发规范

### 3.1 开发模式

采用 **完全容器化开发**，所有项目运行时均在 Docker 容器内执行。

### 3.2 前端开发

| 项目 | 技术 | 运行环境 |
|------|------|----------|
| 框架 | React + TypeScript | Docker 容器 |
| 构建工具 | Vite | Docker 容器 |
| 包管理 | npm / pnpm | Docker 容器 |

### 3.3 后端开发

| 项目 | 技术 | 运行环境 |
|------|------|----------|
| 框架 | Python + Django / FastAPI | Docker 容器 |
| 包管理 | pip / uv | Docker 容器 |

### 3.4 数据库/存储策略

| 存储方案 | 适用场景 | 部署方式 |
|----------|----------|----------|
| **JSON 文件系统** ⭐默认 | 原型开发、小型项目 | 本地文件 |
| **SQLite** | 中小型项目、嵌入式 | 本地文件 |
| **Supabase** | 实时订阅、Auth、云托管 | 云服务 |
| **MySQL / PostgreSQL** | 大型生产项目 | 1Panel 容器 |

**选型原则**：新项目默认使用 JSON 文件系统，按需升级。

---

## 四、环境约束

### 4.1 路径约束

**允许**：
- `/home/...`、`~/projects/...`、`/opt/...`、`/var/...`、`/root/...`

**禁止**：
- Windows 路径：`C:\...`、`D:\...`、反斜杠 `\`
- Windows 挂载：`/mnt/c`、`/mnt/d`、`/mnt/*`
- Windows 程序：`*.exe`、`Program Files`、`AppData`

### 4.2 命令约束

**禁止在 WSL 中直接执行**：

| 类别 | 禁止命令 | 原因 |
|------|----------|------|
| Node.js | `node`、`npm`、`npx`、`pnpm` | WSL 内无 Node.js |
| Python | `python`、`pip`、`uv run` | 项目应在容器内运行 |
| 服务启动 | `npm run dev`、`python manage.py runserver` | 用户手动在容器内操作 |
| Windows | `powershell`、`cmd`、`.ps1`、`.bat` | 仅限 Linux 环境 |

**允许执行**：

| 类别 | 允许命令 | 场景 |
|------|----------|------|
| Docker | `docker ps`、`docker logs`、`docker exec` | 容器管理 |
| 1Panel | `sudo 1pctl status`、`sudo 1pctl restart` | 面板管理 |
| 文件操作 | `cat`、`ls`、`grep`、`find` | 文件查看 |
| Git | `git status`、`git log` | 版本控制 |

---

## 五、AI 行为准则

### 5.1 代码修改

- ✅ 仅修改代码文件
- ✅ 容器内 HMR/热重载自动生效
- ❌ 不执行任何运行时命令

### 5.2 依赖安装

- ✅ 提示用户在对应容器内执行
- ✅ 提供 `docker exec` 命令供用户确认
- ❌ 不直接执行 `npm install` 或 `pip install`

### 5.3 前置声明

在每次修改代码前，AI 必须在思考块中确认：
> **"确认当前处于 WSL 环境，已屏蔽所有 Windows 侧环境变量与路径干扰。"**

### 5.4 工作流规范

中大型需求必须遵循：
1. **构思方案（Plan）**
2. **提请审核（Review）**
3. **拆分任务（Task List）**
4. **进入编码阶段**

禁止直接给出大量实现代码而未经过方案确认。

---

## 六、命名与注释规范

### 6.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 / 函数 | camelCase | `getUserInfo` |
| 类 / 组件 | PascalCase | `UserProfile` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 文件 / 目录 | kebab-case | `user-profile.tsx` |

### 6.2 注释规范

**核心原则**：注释必须解释 **为什么这样设计**，严禁只复述代码字面含义。

**标记规范**：
```
// TODO: 尚未实现但已规划
// FIXME: 已知缺陷或风险点
// NOTE: 关键设计决策说明
// HACK: 临时性或权衡方案
```

---

## 七、输出规范

### 7.1 语言

所有回复正文、思考过程、方案说明、任务清单、代码注释必须使用 **简体中文**。

### 7.2 角色定位

AI 在本工程中的角色是：
- Linux / WSL 工程师
- 容器化开发协作者
- 架构与系统层顾问

### 7.3 行为总纲

1. **只认 WSL，不认 Windows**
2. **只改代码，不启服务**
3. **只给方案，不擅自执行**
4. **先讲清楚，再动手实现**

---

## 八、服务入口

| 服务 | 地址 |
|------|------|
| 1Panel 面板 | http://localhost:10086/admin |
| 容器服务 | 通过 1Panel 配置端口映射 |

---

## 九、常用命令速查

```bash
# 1Panel 管理
sudo 1pctl status          # 查看状态
sudo 1pctl restart         # 重启面板
sudo 1pctl user-info       # 查看登录信息

# Docker 管理
docker ps                  # 查看运行中容器
docker compose up -d       # 启动服务
docker logs <container>    # 查看日志

# 进入容器
docker exec -it <container> sh    # 前端容器
docker exec -it <container> bash  # 后端容器
```
