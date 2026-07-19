"""Fix LIHTCPUB.xlsx by removing unsupported XML attributes."""
import zipfile

src = "dataset/LIHTCPUB.xlsx"
dst = "dataset/LIHTCPUB_fixed.xlsx"

with zipfile.ZipFile(src, "r") as zin:
    with zipfile.ZipFile(dst, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.endswith(".xml"):
                text = data.decode("utf-8", errors="replace")
                text = text.replace('synchVertical="1"', "")
                text = text.replace('synchVertical="0"', "")
                text = text.replace('transitionEvaluation="1"', "")
                text = text.replace('transitionEvaluation="0"', "")
                data = text.encode("utf-8")
            zout.writestr(item, data)

print("Fixed file created")

import pandas as pd
try:
    df = pd.read_excel(dst, sheet_name="Data", nrows=5)
    print("Success!")
    print("Columns:", list(df.columns))
    print(df.head(2).to_string())
except Exception as e:
    print(f"Still errors: {e}")
