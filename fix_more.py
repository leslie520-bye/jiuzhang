import os, subprocess

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "lib", "diagnostic-engine.js")

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix line 146: missing argument in Error()
content = content.replace(
    'if (!response.ok) throw new Error(API error: );',
    'if (!response.ok) throw new Error("API error: " + response.status);'
)

# Fix the jsonMatch regex - the {\\s\\S} pattern should be {[\\s\\S]*} to match JSON objects
# In the file, this already looks correct: /{[\\s\\S]*}/
# Let me check if it was corrupted
if r'{[\s\S]*}' in content:
    print("jsonMatch regex OK")
elif r'{[\\s\\S]*}' in content:
    print("jsonMatch regex with double escape - checking...")
    # This is likely correct - in JS string, \\\\s becomes \\s which matches whitespace

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

# Check syntax
node_path = r"C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
result = subprocess.run([node_path, "--check", path], capture_output=True, text=True, timeout=5000)
if result.returncode == 0:
    print("SYNTAX OK!")
else:
    print("Syntax errors:")
    for line in result.stderr.strip().split("\n"):
        if line.strip():
            print(f"  {line}")
