import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"

doc = f"""# 九章部署与收费指南

## 一、在阿里云需要购买的东西

### 必买项

| 项目 | 推荐配置 | 年费用 | 说明 |
|------|---------|-------|------|
| **域名** | .com / .cn | ~30-50元/年 | 建议先买 .com（免ICP备案） |
| **云服务器 ECS** | 1核2G | ~1,200元/年 | 轻量应用服务器即可 |

**阿里云购买指引：**
1. 访问 aliyun.com → 域名注册 → 搜索你的域名（如 jiuzhang.com）
2. 域名管理 → 实名认证 → 解析到你的服务器 IP
3. 云服务器 ECS → 选择"轻量应用服务器"（1核2G，Linux）
4. 安全组 → 开放端口 3456（或 80/443）

### 可选（按需购买）

| 项目 | 用途 | 费用 |
|------|------|------|
| **OSS 对象存储** | 存储试卷照片 | 按量计费，每月几块钱 |
| **RDS 云数据库** | MySQL 替代 SQLite | ~600元/年 |

### 替代方案（不买服务器也能跑）

如果你暂时不想买服务器：
- **保持 Vercel 免费部署**（已有 vercel.json）
- 域名绑定到 Vercel（免费）
- 数据库用 Turso（免费额度 500MB）

---

## 二、推荐架构（零成本方案）

```
                    ┌─ 域名 (阿里云 ~50元/年)
                    │
                    ▼
           ┌────────────────┐
           │   Vercel CDN   │  ← 免费，全球加速
           │  (jiuzhang.vercel.app) │
           └───────┬────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
   ┌────────────┐   ┌────────────┐
   │ API (Node) │   │  前端静态  │
   │ 免费额度   │   │  Vercel    │
   └──────┬─────┘   │  自动托管  │
          │         └────────────┘
          ▼
   ┌────────────┐
   │  Turso DB  │  ← 免费 500MB
   │  (SQLite   │
   │  兼容)     │
   └────────────┘
```

**这个方案的总成本：域名费 ~50元/年**，其他全部免费。

---

## 三、数据库方案

### 方案 A：保持不变（推荐早期使用）

继续用 SQLite，数据存在服务器的 data/diagnoses.db 文件中。

**如果部署到 Vercel**，SQLite 不能正常工作（Vercel 是无状态函数），所以 Vercel 版本已经用了内存数据库（api/index.js 中的 _dbStore）。

**建议**：初期直接买一台轻量服务器跑 Node.js，用 SQLite 最省事。

### 方案 B：迁移到 Turso（已有代码支持）

Turso 是一个兼容 SQLite 的云数据库，有免费额度。代码中的 database.js 已经支持。

**迁移步骤**：
1. 注册 turso.tech
2. 创建数据库
3. 获取访问令牌
4. 更新 .env 中的 TURSO_URL 和 TURSO_TOKEN

### 方案 C：阿里云 RDS MySQL

如果后续用户量大，可以迁移到 RDS MySQL。代码需要做数据库适配。

---

## 四、收费模块实施

### 整体架构

```
用户点击"使用" → 检查 localStorage 是否已付费
     ↓ 未付费
弹窗显示支付二维码 → 用户扫码支付 → PayJS 回调 → 标记已付费 → 解锁功能
```

### 需要配置的支付参数

在 .env 文件中添加：

```
# PayJS 支付配置（注册 payjs.cn 获取）
PAYJS_MERCHANT_ID=你的商户号
PAYJS_KEY=你的密钥
SITE_URL=https://你的域名
```

### 注册 PayJS 步骤

1. 访问 payjs.cn → 注册商户
2. 提交资料审核（个人即可，无需公司）
3. 获取商户号（mchid）和通信密钥（key）
4. 填入 .env 文件
5. 设置回调地址为：`https://你的域名/api/payment/notify`

### 支付流程

```
前端请求 /api/payment/create
  → 后端生成订单号，调用 PayJS API
  → PayJS 返回二维码链接
  → 前端展示二维码
  → 用户微信扫码支付 9.90 元
  → PayJS 异步通知 /api/payment/notify
  → 前端轮询 /api/payment/check 确认支付成功
  → 标记 localStorage 为已付费
  → 解锁功能
```

### 调试模式

当前系统默认是测试模式（mock），不需要真实付费即可测试：
- 点击"支付"按钮 → 自动标记为已付费
- 不需要 PayJS 配置
- .env 中不填 PAYJS 配置时自动启用 mock 模式

上线后，只需要在 .env 中填入 PAYJS 的商户号和密钥，系统自动切换到真实支付。

---

## 五、部署步骤

### 方式一：部署到云服务器（推荐）

```bash
# 1. 购买 ECS 后，SSH 登录服务器
ssh root@你的服务器IP

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# 3. 上传代码
# 从本地用 scp 上传或用 git clone

# 4. 安装依赖
cd jiuzhang-temp
npm install

# 5. 配置环境变量
# 编辑 .env 文件，填入 DeepSeek API Key 和 PayJS 配置
# 注意：服务器上的 .env 需要设置 DEEPSEEK_API_KEY

# 6. 配置 nginx 反向代理（可选，为了 80 端口访问）
apt-get install nginx
# 配置文件 /etc/nginx/conf.d/jiuzhang.conf：
# server {{
#     listen 80;
#     server_name 你的域名;
#     location / {{
#         proxy_pass http://localhost:3456;
#         proxy_set_header Host $host;
#     }}
# }}
# nginx -s reload

# 7. 用 pm2 保持服务运行
npm install -g pm2
pm2 start server.js --name jiuzhang
pm2 save
pm2 startup

# 8. 配置域名解析
# 在阿里云域名管理 → 添加 A 记录 → 指向你的服务器 IP
"""

# Write the deployment guide
with open(os.path.join(ws, "README-DEPLOY.md"), "w", encoding="utf-8") as f:
    f.write(doc)
print(f"Deployment guide: {os.path.getsize(os.path.join(ws, 'README-DEPLOY.md')):,} bytes")

# Also check current payment mock status
env_path = os.path.join(ws, ".env")
with open(env_path, "r", encoding="utf-8") as f:
    env = f.read()
if "PAYJS" not in env:
    with open(env_path, "a", encoding="utf-8") as f:
        f.write("\n# PayJS Payment\nPAYJS_MERCHANT_ID=\nPAYJS_KEY=\nSITE_URL=\n")
print("Updated .env with PayJS placeholders")
