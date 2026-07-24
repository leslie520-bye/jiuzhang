import os
path = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp\api\index.js"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()
code = code.replace('../lib/diagnostic-engine', './lib/diagnostic-engine')
with open(path, "w", encoding="utf-8") as f:
    f.write(code)
print("Path updated. New: ./lib/diagnostic-engine")
