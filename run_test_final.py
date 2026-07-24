import os, subprocess

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
node_path = r"C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
test_path = os.path.join(ws, "test-llm.js")

result = subprocess.run(
    [node_path, test_path],
    capture_output=True, text=False, timeout=30000, cwd=ws
)

# Use errors=replace to handle non-UTF8 bytes
try:
    stdout = result.stdout.decode("utf-8", errors="replace")
    if stdout.strip():
        print("=== OUTPUT ===")
        print(stdout)
except:
    print(f"stdout: {len(result.stdout)} bytes (non-utf8)")

try:
    stderr = result.stderr.decode("utf-8", errors="replace")
    if stderr.strip():
        print("=== ERRORS (last 10 lines) ===")
        lines = stderr.strip().split("\n")
        for line in lines[-10:]:
            if line.strip():
                print(line)
except:
    print(f"stderr: {len(result.stderr)} bytes (non-utf8)")

print(f"\nExit code: {result.returncode}")
