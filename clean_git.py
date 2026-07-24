import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"

# Update .gitignore to exclude dev scripts
gitignore = """node_modules/
.git/
.env
.env.production
data/
uploads/
*.db
*.log
.DS_Store
.vscode/
.idea/
__pycache__/
*.pyc

# Build/temp scripts (not needed in production)
add_engine_api.py
check_encoding.py
check_lines.py
create_deploy.py
fix_l129.py
fix_more.py
gen_deploy_doc.py
gen_deploy_pdf.py
gen_llm_page.py
gen_test.py
run_test.py
run_test2.py
run_test3.py
run_test_final.py
setup.py
setup_env.py
update_api.py
update_server.py
update_server_final.py
test-diagnose.js
test-llm.js
test-llm2.js
"""
with open(os.path.join(ws, ".gitignore"), "w", encoding="utf-8") as f:
    f.write(gitignore)

# Re-init git with clean ignore
import subprocess
subprocess.run(["git", "rm", "-r", "--cached", "."], cwd=ws, capture_output=True)
subprocess.run(["git", "add", "-A"], cwd=ws)
subprocess.run(["git", "commit", "-m", "Clean up: remove dev scripts from tracking"], cwd=ws)
print("Git repo cleaned up")
