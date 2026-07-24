import os, subprocess

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
node_path = r"C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node.exe"

if not os.path.exists(node_path):
    print(f"Node not found at {node_path}")
else:
    print(f"Node found: {node_path}")
    ver = subprocess.check_output([node_path, "--version"], text=True).strip()
    print(f"Node version: {ver}")
    
    print("Running test-llm.js...")
    result = subprocess.run(
        [node_path, os.path.join(ws, "test-llm.js")],
        capture_output=True, text=True, timeout=30000,
        cwd=ws
    )
    print("=== STDOUT ===")
    print(result.stdout)
    if result.stderr:
        stderr_lines = result.stderr.strip().split("\n")
        print("=== STDERR (first 10 lines) ===")
        for line in stderr_lines[:10]:
            print(line)
    print(f"Return code: {result.returncode}")
