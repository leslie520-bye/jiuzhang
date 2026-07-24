import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "server.js")

# Try different encodings
for enc in ["utf-8", "gbk", "gb2312", "latin-1"]:
    try:
        with open(path, "r", encoding=enc) as f:
            code = f.read()
        print(f"{enc}: {len(code)} chars, OK")
        break
    except:
        print(f"{enc}: failed")
        continue

# Use latin-1 which never fails
with open(path, "r", encoding="latin-1") as f:
    code = f.read()

# Check what's at position 6001
print(f"At 6001: {code[5990:6015]}")
print(f"Char: {repr(code[6001])}, ord: {ord(code[6001])}")
