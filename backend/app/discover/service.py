import csv
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / "data"
LIHTC_FILE = DATA_DIR / "lihtc_2024_filtered.csv"

DATA_COVERAGE_NOTE = "HUD LIHTC database — projects through 2024 only"


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
                bedroom_mix = {
                    "0": int(row["bedroom_studio"]),
                    "1": int(row["bedroom_1br"]),
                    "2": int(row["bedroom_2br"]),
                    "3": int(row["bedroom_3br"]),
                }
                self._properties.append({
                    "property_name": row["property_name"],
                    "address": row["address"],
                    "cbsa_code": row["cbsa_code"],
                    "total_units": int(row["total_units"]),
                    "low_income_units": int(row["low_income_units"]),
                    "bedroom_mix": bedroom_mix,
                    "year_placed_in_service": int(row["year_placed_in_service"]),
                    "data_coverage_note": DATA_COVERAGE_NOTE,
                })

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
                if any(
                    int(br) >= min_bedrooms and count > 0
                    for br, count in p["bedroom_mix"].items()
                )
            ]
        if max_bedrooms is not None:
            results = [
                p
                for p in results
                if any(
                    int(br) <= max_bedrooms and count > 0
                    for br, count in p["bedroom_mix"].items()
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
