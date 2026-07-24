import os, subprocess

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
node_path = r"C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

print(f"Node: {os.path.getsize(node_path):,} bytes")
ver = subprocess.check_output([node_path, "--version"], text=True).strip()
print(f"Version: {ver}")

print("Running test-llm.js...")
result = subprocess.run(
    [node_path, os.path.join(ws, "test-llm.js")],
    capture_output=True, text=True, timeout=30000,
    cwd=ws
)
print("=== OUTPUT ===")
for line in result.stdout.split("\n"):
    print(line)
if result.stderr:
    err = result.stderr.strip()
    if err:
        print("=== ERRORS ===")
        print(err[:1000])
print(f"Exit: {result.returncode}")
