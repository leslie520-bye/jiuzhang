import os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont("SH", "C:/Windows/Fonts/simhei.ttf"))
pdfmetrics.registerFont(TTFont("SHB", "C:/Windows/Fonts/simhei.ttf"))

def S(f, sz, a=TA_LEFT, b=False, c="#2D2D2D", sb=0, sa=1.5):
    fn = (f + "B") if (b and not f.endswith("B")) else f
    return ParagraphStyle("x", fontName=fn, fontSize=sz, leading=sz*1.45,
        alignment=a, textColor=HexColor(c), spaceBefore=sb*mm, spaceAfter=sa*mm)

desktop = os.path.join(os.path.expanduser("~"), "Desktop")
ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"

with open(os.path.join(ws, "README-DEPLOY.md"), "r", encoding="utf-8") as f:
    md = f.read()

doc = SimpleDocTemplate(os.path.join(desktop, "九章_部署与收费指南.pdf"), pagesize=A4,
    topMargin=2*cm, bottomMargin=2*cm, leftMargin=2.5*cm, rightMargin=2.5*cm)
ele = []

for line in md.split("\n"):
    s = line.rstrip()
    if not s.strip():
        ele.append(Spacer(1, 1.5*mm))
    elif s.startswith("# "):
        ele.append(Paragraph(s[2:].strip(), S("SHB", 15, TA_LEFT, True, "#1B2A4A", 6, 3)))
    elif s.startswith("## "):
        ele.append(Paragraph(s[3:].strip(), S("SHB", 11, TA_LEFT, True, "#1B2A4A", 4, 2)))
    elif s.startswith("### "):
        ele.append(Paragraph(s[4:].strip(), S("SHB", 10, TA_LEFT, True, "#2C4A7C", 3, 1.5)))
    elif s.startswith("- ") or s.startswith("* "):
        text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s[2:])
        ele.append(Paragraph(f"\u2022 {text}", S("SH", 9, TA_LEFT, False, "#2D2D2D", 0, 0.5)))
    elif s.startswith("|") and "---" not in s:
        cells = [c.strip() for c in s.strip("|").split("|") if c.strip()]
        if cells:
            txt = " | ".join(cells)
            is_h = any(w in s for w in ["项目", "配置", "步骤"])
            ele.append(Paragraph(txt, S("SHB" if is_h else "SH", 7.5, TA_LEFT, is_h, "#1B2A4A" if is_h else "#2D2D2D", 0, 0)))
    elif s.startswith("```"):
        pass
    else:
        text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        text = re.sub(r"\{(.+?)\}", r"<i>\1</i>", text)
        ele.append(Paragraph(text, S("SH", 9, TA_LEFT, False, "#2D2D2D", 0, 0.5)))

fp = os.path.join(desktop, "九章_部署与收费指南.pdf")
doc.build(ele)
print(f"PDF: {os.path.getsize(fp):,} bytes")
print("Done!")
