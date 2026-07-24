import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "lib", "diagnostic-engine.js")
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Show lines 145-155
for i in range(144, min(160, len(lines))):
    line = lines[i].rstrip()
    if line.strip():
        print(f"L{i+1}: {line[:100]}")

print("\n---", f"Total: {len(lines)} lines")
