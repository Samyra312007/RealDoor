import json
import re
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / "data" / "mtsp"
CORPUS_FILE = DATA_DIR / "mtsp_2026.json"


class MTSPCorpus:
    def __init__(self):
        self._data = None
        self._chunks: list[dict] = []
        self._load()

    def _load(self):
        if not CORPUS_FILE.exists():
            self._data = {"meta": {}, "regions": []}
            return
        with open(CORPUS_FILE, encoding="utf-8") as f:
            self._data = json.load(f)
        self._build_chunks()

    def _build_chunks(self):
        meta = self._data.get("meta", {})
        for region in self._data.get("regions", []):
            for limit in region.get("income_limits", []):
                hh = limit["household_size"]
                chunk = {
                    "content": (
                        f"In the {region['cbsa_name']} metro area ({region['cbsa_code']}), "
                        f"the {meta.get('program', 'MTSP')} {meta.get('year', 2026)} income limits "
                        f"for a {hh}-person household are: "
                        f"30% AMI = ${limit['ami_30']:,}, "
                        f"50% AMI = ${limit['ami_50']:,}, "
                        f"60% AMI = ${limit['ami_60']:,}. "
                        f"These limits are effective {meta.get('effective_date', '2026-05-01')}."
                    ),
                    "metadata": {
                        "program": meta.get("program", "MTSP"),
                        "cbsa_code": region["cbsa_code"],
                        "cbsa_name": region["cbsa_name"],
                        "state": region["state"],
                        "counties": ", ".join(region["counties"]),
                        "household_size": hh,
                        "ami_30": limit["ami_30"],
                        "ami_50": limit["ami_50"],
                        "ami_60": limit["ami_60"],
                        "effective_date": meta.get("effective_date", "2026-05-01"),
                        "source_url": meta.get("source_url", ""),
                    },
                }
                self._chunks.append(chunk)

    @property
    def chunks(self) -> list[dict]:
        return self._chunks

    def get_region(self, cbsa_code: str) -> Optional[dict]:
        for region in self._data.get("regions", []):
            if region["cbsa_code"] == cbsa_code:
                return region
        return None

    def get_limits(self, cbsa_code: str, household_size: int) -> Optional[dict]:
        region = self.get_region(cbsa_code)
        if not region:
            region = self.get_region("default")
        if not region:
            return None
        for limit in region["income_limits"]:
            if limit["household_size"] == household_size:
                return {
                    **limit,
                    "cbsa_name": region["cbsa_name"],
                    "cbsa_code": region["cbsa_code"],
                    "state": region["state"],
                    "effective_date": self._data["meta"]["effective_date"],
                    "source_url": self._data["meta"]["source_url"],
                }
        return None

    @property
    def meta(self) -> dict:
        return self._data.get("meta", {})


corpus = MTSPCorpus()
