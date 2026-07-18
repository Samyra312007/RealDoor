import csv
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / "data"
LIHTC_FILE = DATA_DIR / "lihtc_2024_filtered.csv"


class LIHTCService:
    def __init__(self):
        self._properties: list[dict] = []
        self._load()

    def _load(self):
        if not LIHTC_FILE.exists():
            return
        with open(LIHTC_FILE, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                row["total_units"] = int(row["total_units"])
                row["low_income_units"] = int(row["low_income_units"])
                row["bedroom_studio"] = int(row["bedroom_studio"])
                row["bedroom_1br"] = int(row["bedroom_1br"])
                row["bedroom_2br"] = int(row["bedroom_2br"])
                row["bedroom_3br"] = int(row["bedroom_3br"])
                row["year_placed_in_service"] = int(row["year_placed_in_service"])
                self._properties.append(row)

    @property
    def properties(self) -> list[dict]:
        return list(self._properties)

    def get_by_cbsa(
        self,
        cbsa_code: str,
        min_bedrooms: Optional[int] = None,
        max_bedrooms: Optional[int] = None,
        min_units: Optional[int] = None,
    ) -> list[dict]:
        results = [p for p in self._properties if p["cbsa_code"] == cbsa_code]
        if min_bedrooms is not None:
            results = [
                p
                for p in results
                if (
                    (min_bedrooms <= 0 and p["bedroom_studio"] > 0)
                    or (min_bedrooms <= 1 and p["bedroom_1br"] > 0)
                    or (min_bedrooms <= 2 and p["bedroom_2br"] > 0)
                    or (min_bedrooms <= 3 and p["bedroom_3br"] > 0)
                )
            ]
        if max_bedrooms is not None:
            results = [
                p
                for p in results
                if not (
                    (max_bedrooms < 0 and p["bedroom_studio"] > 0)
                    or (max_bedrooms < 1 and p["bedroom_1br"] > 0)
                    or (max_bedrooms < 2 and p["bedroom_2br"] > 0)
                    or (max_bedrooms < 3 and p["bedroom_3br"] > 0)
                )
            ]
        if min_units is not None:
            results = [p for p in results if p["total_units"] >= min_units]
        return results

    def get_cbsa_codes(self) -> list[str]:
        codes: set[str] = set()
        for p in self._properties:
            codes.add(p["cbsa_code"])
        return sorted(codes)


lihtc_service = LIHTCService()
