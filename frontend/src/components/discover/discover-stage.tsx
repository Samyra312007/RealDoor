import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDiscover, type Property } from "@/hooks/useDiscover";
import {
  Building2,
  MapPin,
  Users,
  BedDouble,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Info,
  Sliders,
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

const FILTER_FEATURES = [
  "Metro Area (CBSA code) — filters by metropolitan statistical area",
  "Min Bedrooms — only properties with units ≥ selected bedroom count",
  "Max Bedrooms — only properties with units ≤ selected bedroom count",
  "Min Total Units — only properties with at least N total units",
];

function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            <Building2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {property.property_name}
          </h4>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {property.address}
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-600">
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
              className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
            >
              <BedDouble className="h-3 w-3" aria-hidden="true" />
              {BEDROOM_LABELS[br] || `${br} BR`}: {count}
            </span>
          );
        })}
      </div>

      <p className="mt-1 text-[10px] italic text-neutral-400">
        Location only — contact property for current availability
      </p>
      <p className="text-[10px] text-neutral-400">{property.data_coverage_note}</p>
    </div>
  );
}

export function DiscoverStage({ sessionToken }: { sessionToken: string | null }) {
  const {
    properties,
    totalCount,
    loading,
    error,
    stalenessNote,
    disclaimer,
    filtersApplied,
    fmr,
    fmrLoading,
    search,
    loadFmr,
    setError,
  } = useDiscover();

  const [selectedCbsa, setSelectedCbsa] = useState("12086");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minUnits, setMinUnits] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showFiltersInfo, setShowFiltersInfo] = useState(false);

  const handleSearch = async () => {
    setError(null);
    try {
      await search(
        selectedCbsa,
        minBedrooms !== "" ? Number(minBedrooms) : undefined,
        maxBedrooms !== "" ? Number(maxBedrooms) : undefined,
        minUnits !== "" ? Number(minUnits) : undefined
      );
      setHasSearched(true);
      loadFmr(selectedCbsa);
    } catch {
      // error state set by hook
    }
  };

  return (
    <section aria-labelledby="discover-heading">
      <h2 id="discover-heading" className="mb-6 text-2xl font-bold text-neutral-900">
        Stage 4: Discover Properties (Stretch)
      </h2>
      <p className="mb-6 text-neutral-600">
        Browse LIHTC properties in your target metro area. All data is for location reference only.
        Contact properties directly for current availability, income limits, and application status.
      </p>

      <div
        role="alert"
        className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong>Data staleness:</strong> HUD LIHTC database — projects through 2024 only.
          Contact properties for current availability and income limits.
        </span>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Card title="Search Properties" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="cbsa-select" className="mb-1 block text-sm font-medium text-neutral-700">
              Metro Area
            </label>
            <select
              id="cbsa-select"
              value={selectedCbsa}
              onChange={(e) => setSelectedCbsa(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              {Object.entries(CBSA_OPTIONS).map(([code, name]) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="min-bedrooms" className="mb-1 block text-sm font-medium text-neutral-700">
              Min Bedrooms
            </label>
            <select
              id="min-bedrooms"
              value={minBedrooms}
              onChange={(e) => setMinBedrooms(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              {BEDROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="max-bedrooms" className="mb-1 block text-sm font-medium text-neutral-700">
              Max Bedrooms
            </label>
            <select
              id="max-bedrooms"
              value={maxBedrooms}
              onChange={(e) => setMaxBedrooms(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
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
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </Card>

      {hasSearched && !loading && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm" role="status" aria-live="polite">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            <Building2 className="h-3 w-3" aria-hidden="true" />
            {totalCount} propert{totalCount === 1 ? "y" : "ies"} found
          </span>
          <span className="text-xs text-neutral-500">{CBSA_OPTIONS[selectedCbsa]} ({selectedCbsa})</span>
          <Button variant="ghost" size="sm" onClick={() => setShowFiltersInfo(!showFiltersInfo)} aria-expanded={showFiltersInfo}>
            <Sliders className="mr-1 h-3 w-3" aria-hidden="true" />
            Filters
          </Button>
        </div>
      )}

      {showFiltersInfo && hasSearched && (
        <Card title="Filters Applied" className="mb-4">
          <ul className="space-y-1 text-xs text-neutral-600" role="list">
            {Object.entries(filtersApplied).map(([key, value]) => (
              <li key={key} className="flex gap-2">
                <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                <span>{value !== null && value !== undefined ? String(value) : "none"}</span>
              </li>
            ))}
          </ul>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
              How these filters work
            </summary>
            <ul className="mt-2 space-y-1" role="list">
              {FILTER_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-neutral-500">
                  <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-neutral-400" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </details>
        </Card>
      )}

      {fmr && !loading && hasSearched && (
        <Card title="Fair Market Rents Context" className="mb-6">
          <p className="mb-3 text-xs text-neutral-500">{fmr.context_note}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(fmr.fair_market_rents).map(([bedroom, amount]) => (
              <div key={bedroom} className="rounded-lg border border-neutral-100 bg-neutral-50 p-2 text-center">
                <p className="text-xs text-neutral-500">{bedroom.replace(/_/g, " ")}</p>
                <p className="text-sm font-semibold text-neutral-900">${amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Source: HUD FY2026 FMR, effective {fmr.effective_date}
          </p>
        </Card>
      )}

      {loading && (
        <div role="status" aria-live="polite" className="py-8 text-center text-sm text-neutral-500">
          Loading properties...
        </div>
      )}

      {!loading && hasSearched && properties.length === 0 && (
        <Card className="mb-6">
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Info className="h-4 w-4" aria-hidden="true" />
            No properties match your filters. Try adjusting your search criteria.
          </p>
        </Card>
      )}

      {!loading && properties.length > 0 && (
        <div role="list" aria-label="Property list" className="grid gap-4 sm:grid-cols-2">
          {properties.map((p, i) => (
            <PropertyCard key={`${p.property_name}-${i}`} property={p} />
          ))}
        </div>
      )}

      {hasSearched && disclaimer && (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
            <p className="text-xs text-neutral-500">{disclaimer}</p>
          </div>
        </div>
      )}
    </section>
  );
}
