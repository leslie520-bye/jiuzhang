import os, subprocess

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
node_path = r"C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

# Run with binary capture to avoid GBK issues
result = subprocess.run(
    [node_path, os.path.join(ws, "test-llm.js")],
    capture_output=True, text=False, timeout=30000,
    cwd=ws
)

# Try decoding stdout
try:
    stdout = result.stdout.decode("utf-8", errors="replace")
    print("=== STDOUT ===")
    for line in stdout.split("\n"):
        if line.strip():
            print(line)
except:
    print(f"stdout: {len(result.stdout)} bytes (non-utf8)")

# Try decoding stderr
try:
    stderr = result.stderr.decode("utf-8", errors="replace")
    if stderr.strip():
        print("=== STDERR ===")
        for line in stderr.split("\n"):
            if line.strip():
                print(line)
except:
    print(f"stderr: {len(result.stderr)} bytes (non-utf8)")

print(f"Exit: {result.returncode}")
