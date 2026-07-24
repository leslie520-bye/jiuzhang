import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
domain = "mathjiuzhang.cn"

# 1. Update .env with production settings
env_content = f"""# DeepSeek API Key
DEEPSEEK_API_KEY=sk-e43fe3252bbf436f95e4f46b8ddb9819

# Database
DB_PATH=./data/diagnoses.db

# PayJS Payment (在 payjs.cn 注册后填写)
PAYJS_MERCHANT_ID=
PAYJS_KEY=
SITE_URL=https://{domain}

# Server
PORT=3456
"""

with open(os.path.join(ws, ".env"), "w", encoding="utf-8") as f:
    f.write(env_content)

# 2. Create .env.production for Vercel deployment
env_prod = f"""DEEPSEEK_API_KEY=sk-e43fe3252bbf436f95e4f46b8ddb9819
PAYJS_MERCHANT_ID=
PAYJS_KEY=
SITE_URL=https://{domain}
"""

with open(os.path.join(ws, ".env.production"), "w", encoding="utf-8") as f:
    f.write(env_prod)

print(".env updated with domain mathjiuzhang.cn")
