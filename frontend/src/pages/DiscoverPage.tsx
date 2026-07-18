import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LedgerStamp } from "@/components/ui/ledger-stamp";
import { useDiscover, type Property } from "@/hooks/useDiscover";
import { useSessionContext } from "@/lib/session-context";
import {
  Building2, MapPin, Users, BedDouble, Calendar,
  AlertCircle, Info,
} from "lucide-react";

const CBSA_OPTIONS: Record<string, string> = {
  "12086": "Atlanta, GA",
  "16980": "Chicago, IL",
  "31080": "Los Angeles, CA",
  "35620": "New York, NY",
  "19100": "Dallas, TX",
};

const BEDROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 BR" },
  { value: "2", label: "2 BR" },
  { value: "3", label: "3 BR" },
];

const BEDROOM_LABELS: Record<string, string> = {
  "0": "Studio",
  "1": "1 BR",
  "2": "2 BR",
  "3": "3 BR",
};

function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="flex flex-col gap-2 border border-line bg-paper p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="flex items-center gap-1.5 font-sans text-sm font-semibold text-ink">
            <Building2 className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
            {property.property_name}
          </h4>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-2xs text-ink/50">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {property.address}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 font-mono text-2xs text-ink/60">
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          {property.total_units} total / {property.low_income_units} LI
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          {property.low_income_units > 0
            ? Math.round((property.low_income_units / property.total_units) * 100)
            : 0}% LI
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          Built {property.year_placed_in_service}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="list" aria-label="Bedroom mix">
        {Object.entries(property.bedroom_mix).map(([br, count]) => {
          if (count <= 0) return null;
          return (
            <span
              key={br}
              className="inline-flex items-center gap-0.5 border border-line px-2 py-0.5 font-mono text-2xs text-ink/60"
            >
              <BedDouble className="h-3 w-3" aria-hidden="true" />
              {BEDROOM_LABELS[br] || `${br} BR`}: {count}
            </span>
          );
        })}
      </div>

      <p className="mt-1 font-mono text-[10px] italic text-ink/40">
        Location only \u2014 contact property for current availability
      </p>
    </div>
  );
}

export function DiscoverPage() {
  const { token } = useSessionContext();
  const {
    properties, totalCount, loading, error,
    search, setError,
  } = useDiscover();

  const [selectedCbsa, setSelectedCbsa] = useState("12086");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minUnits, setMinUnits] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setError(null);
    try {
      await search(
        selectedCbsa,
        minBedrooms !== "" ? Number(minBedrooms) : undefined,
        maxBedrooms !== "" ? Number(maxBedrooms) : undefined,
        minUnits !== "" ? Number(minUnits) : undefined
      );
      setHasSearched(true);
    } catch {
      /* error state set by hook */
    }
  }, [search, setError, selectedCbsa, minBedrooms, maxBedrooms, minUnits]);

  return (
    <section aria-labelledby="discover-heading">
      <h2 id="discover-heading" className="mb-1 font-display text-xl font-semibold text-ink">
        Stage 04 \u2014 Discover Properties
      </h2>
      <p className="mb-6 font-sans text-sm text-ink/50">
        Browse LIHTC properties in your target metro area. All data is for location reference only.
        Contact properties directly for current availability, income limits, and application status.
      </p>

      {/* Staleness banner — always visible, stamped notice, not dismissible */}
      <div
        className="mb-6 border-2 border-brass/40 bg-brass/5 p-4"
        role="status"
      >
        <div className="mb-2">
          <LedgerStamp variant="brass">HUD 2024</LedgerStamp>
        </div>
        <p className="font-sans text-sm leading-relaxed text-ink/70">
          Data from HUD LIHTC through 2024 \u2014 contact properties
          for current availability and income limits.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 border border-expired/30 bg-expired/5 p-3 font-sans text-sm text-expired">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter controls — renter-selected values only */}
      <div className="mb-6 border border-line bg-paper p-4">
        <div className="mb-3">
          <h3 className="font-display text-base font-semibold text-ink">Filters</h3>
          <p className="font-sans text-2xs text-ink/40">
            All filters are your choice \u2014 the system never ranks or recommends
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="cbsa-select" className="mb-1 block font-sans text-sm font-medium text-ink/80">
              Metro Area
            </label>
            <select
              id="cbsa-select"
              value={selectedCbsa}
              onChange={(e) => setSelectedCbsa(e.target.value)}
              className="flex h-10 w-full rounded-sm border border-line bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {Object.entries(CBSA_OPTIONS).map(([code, name]) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="min-bedrooms" className="mb-1 block font-sans text-sm font-medium text-ink/80">
              Min Bedrooms
            </label>
            <select
              id="min-bedrooms"
              value={minBedrooms}
              onChange={(e) => setMinBedrooms(e.target.value)}
              className="flex h-10 w-full rounded-sm border border-line bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {BEDROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="max-bedrooms" className="mb-1 block font-sans text-sm font-medium text-ink/80">
              Max Bedrooms
            </label>
            <select
              id="max-bedrooms"
              value={maxBedrooms}
              onChange={(e) => setMaxBedrooms(e.target.value)}
              className="flex h-10 w-full rounded-sm border border-line bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {BEDROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Min Total Units"
            type="number"
            placeholder="e.g. 50"
            value={minUnits}
            onChange={(e) => setMinUnits(e.target.value)}
            min={0}
          />
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full"
              aria-busy={loading}
            >
              {loading ? "Searching\u2026" : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {/* Result count */}
      {hasSearched && !loading && (
        <div className="mb-4" role="status" aria-live="polite">
          <span className="inline-flex items-center gap-1 border border-brass/30 px-2 py-0.5 font-mono text-2xs font-medium text-brass">
            <Building2 className="h-3 w-3" aria-hidden="true" />
            {totalCount} propert{totalCount === 1 ? "y" : "ies"} found
          </span>
          <span className="ml-2 font-mono text-2xs text-ink/40">
            {CBSA_OPTIONS[selectedCbsa]} ({selectedCbsa})
          </span>
        </div>
      )}

      {loading && (
        <div role="status" aria-live="polite" className="py-8 text-center">
          <p className="font-sans text-sm text-ink/50">Loading properties\u2026</p>
        </div>
      )}

      {!loading && hasSearched && properties.length === 0 && (
        <div className="border border-line bg-line/20 p-6 text-center">
          <p className="flex items-center justify-center gap-2 font-sans text-sm text-ink/50">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            No properties match your filters. Try adjusting your search criteria.
          </p>
        </div>
      )}

      {!loading && properties.length > 0 && (
        <div role="list" aria-label="Property list" className="grid gap-4 sm:grid-cols-2">
          {properties.map((p, i) => (
            <PropertyCard key={`${p.property_name}-${i}`} property={p} />
          ))}
        </div>
      )}
    </section>
  );
}
