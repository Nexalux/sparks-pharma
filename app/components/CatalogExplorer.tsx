"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogListing } from "../lib/catalog-listing";
import { ProductCard } from "./ProductCard";

type Filters = {
  search: string;
  category: string;
  dosageForm: string;
  manufacturer: string;
  strength: string;
  packSize: string;
  availability: string;
  priceDisplay: string;
  enquiryEligibility: string;
  sort: string;
};

const emptyFilters: Filters = {
  search: "",
  category: "",
  dosageForm: "",
  manufacturer: "",
  strength: "",
  packSize: "",
  availability: "",
  priceDisplay: "",
  enquiryEligibility: "",
  sort: "name-asc",
};

export function CatalogExplorer({
  products,
}: {
  products: CatalogListing[];
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get("category") || "";
    if (!category) return;
    const frame = window.requestAnimationFrame(() => setFilters((current) => ({ ...current, category })));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const options = useMemo(
    () => ({
      category: [...new Set(products.map((product) => product.category))].sort(),
      dosageForm: [...new Set(products.map((product) => product.dosageForm))].sort(),
      manufacturer: [...new Set(products.map((product) => product.manufacturer))].sort(),
      strength: [...new Set(products.map((product) => product.strength))].sort(),
      packSize: [...new Set(products.map((product) => product.packSize))].sort(),
    }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return products.filter((product) => {
      const searchable = [
        product.genericName,
        product.brandName,
        product.composition,
        product.category,
        product.dosageForm,
        product.strength,
        product.packSize,
        product.manufacturer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!filters.category || product.category === filters.category) &&
        (!filters.dosageForm || product.dosageForm === filters.dosageForm) &&
        (!filters.manufacturer || product.manufacturer === filters.manufacturer) &&
        (!filters.strength || product.strength === filters.strength) &&
        (!filters.packSize || product.packSize === filters.packSize) &&
        (!filters.availability || product.availability === filters.availability) &&
        (!filters.priceDisplay || product.priceDisplay === filters.priceDisplay) &&
        (!filters.enquiryEligibility || String(product.enquiryEligible !== false) === filters.enquiryEligibility)
      );
    }).sort((a, b) => {
      if (filters.sort === "name-desc") return b.genericName.localeCompare(a.genericName);
      if (filters.sort === "category") return a.category.localeCompare(b.category) || a.genericName.localeCompare(b.genericName);
      if (filters.sort === "availability") return String(a.availability).localeCompare(String(b.availability)) || a.genericName.localeCompare(b.genericName);
      return a.genericName.localeCompare(b.genericName);
    });
  }, [filters, products]);

  function updateFilter(name: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => key !== "sort" && Boolean(value)).length;
  const hasFilters = activeFilterCount > 0;

  useEffect(() => {
    if (!filtersOpen) return;
    const trigger = filterTriggerRef.current;
    filterCloseRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltersOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [filtersOpen]);

  return (
    <section className="catalog-layout" aria-label="Product catalog">
      <div className="catalog-mobile-toolbar">
        <button ref={filterTriggerRef} type="button" className="filter-trigger" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(true)}>
          <span><b>Filters</b><small>{activeFilterCount ? `${activeFilterCount} active` : "Refine catalog"}</small></span>
          <i aria-hidden="true">{activeFilterCount || "☰"}</i>
        </button>
        <label className="mobile-sort">
          <span className="sr-only">Sort catalog</span>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="category">Category</option><option value="availability">Availability</option></select>
        </label>
      </div>
      <button className={`filter-backdrop ${filtersOpen ? "is-open" : ""}`} type="button" aria-label="Close catalog filters" onClick={() => setFiltersOpen(false)} />
      <aside className={`filter-panel ${filtersOpen ? "is-open" : ""}`} id="catalog-filters" aria-label="Catalog filters">
        <div className="filter-panel-head">
          <div><span className="kicker">REFINE</span><h2>Catalog filters</h2></div>
          <div className="filter-panel-actions">{hasFilters ? <button className="text-button" type="button" onClick={() => setFilters(emptyFilters)}>Clear</button> : null}<button ref={filterCloseRef} className="filter-close" type="button" aria-label="Close catalog filters" onClick={() => setFiltersOpen(false)}>×</button></div>
        </div>
        <label className="filter-search">
          <span>Search products</span>
          <input
            type="search"
            placeholder="Composition, strength…"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </label>
        {(
          [
            ["category", "Therapeutic category"],
            ["dosageForm", "Dosage form"],
            ["manufacturer", "Manufacturer"],
            ["strength", "Strength"],
            ["packSize", "Pack size"],
          ] as const
        ).map(([key, label]) => (
          <label className="filter-select" key={key}>
            <span>{label}</span>
            <select value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)}>
              <option value="">All</option>
              {options[key].map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </label>
        ))}
        <label className="filter-select"><span>Availability</span><select value={filters.availability} onChange={(event) => updateFilter("availability", event.target.value)}><option value="">All</option><option value="available">Available</option><option value="limited">Limited</option><option value="on_request">On request</option><option value="unavailable">Unavailable</option></select></label>
        <label className="filter-select"><span>Pricing</span><select value={filters.priceDisplay} onChange={(event) => updateFilter("priceDisplay", event.target.value)}><option value="">All</option><option value="indicative">Indicative price</option><option value="on_request">Price on request</option><option value="hidden">Not displayed</option></select></label>
        <label className="filter-select"><span>Enquiry status</span><select value={filters.enquiryEligibility} onChange={(event) => updateFilter("enquiryEligibility", event.target.value)}><option value="">All</option><option value="true">Enquiry eligible</option><option value="false">Not eligible</option></select></label>
        <label className="filter-select"><span>Sort by</span><select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="category">Therapeutic category</option><option value="availability">Availability</option></select></label>
        <div className="filter-notice">
          <b>Trade catalog</b>
          <span>Pricing, availability, batch details, and fulfilment are confirmed during quotation.</span>
        </div>
        <button className="primary-action filter-apply" type="button" onClick={() => setFiltersOpen(false)}>Show {filteredProducts.length} {filteredProducts.length === 1 ? "record" : "records"} <span>→</span></button>
      </aside>

      <div className="catalog-results">
        <div className="results-head">
          <div>
            <span className="kicker">GENERIC MEDICINES</span>
            <h2>{filteredProducts.length} catalog {filteredProducts.length === 1 ? "record" : "records"}</h2>
          </div>
          <span className="results-note">Live enquiry eligibility shown per record</span>
        </div>
        {filteredProducts.length ? (
          <div className="product-grid product-grid-catalog">
            {filteredProducts.map((product, index) => (
              <ProductCard product={product} index={index} key={product.slug} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>No matching catalog records</h3>
            <p>Try removing one or more filters to widen the catalog.</p>
            <button type="button" className="primary-action" onClick={() => setFilters(emptyFilters)}>
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
