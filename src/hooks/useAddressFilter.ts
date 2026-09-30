import { useState } from "react";
import type { AddressFilter, unitDetails } from "../utils/interface";

export const EMPTY_ADDRESS_FILTER: AddressFilter = { statuses: [], types: [] };

export const countAddressFilters = (filter: AddressFilter) =>
  filter.statuses.length + filter.types.length;

// Values within a group are alternatives; the two groups must both hold. An
// empty group places no constraint, so an empty filter matches everything.
export const matchesAddressFilter = (
  unit: unitDetails,
  filter: AddressFilter
) =>
  (filter.statuses.length === 0 || filter.statuses.includes(unit.status)) &&
  (filter.types.length === 0 ||
    unit.type.some((type) => filter.types.includes(type.id)));

// Session storage rather than local: a filter that outlived the visit would
// greet a publisher with a greyed-out map the next day and no idea why. It
// also survives the admin map list unmounting rows as they scroll away.
const useAddressFilter = (scope: string) => {
  const key = `address-filter-${scope}`;
  const [filter, setFilterState] = useState<AddressFilter>(() => {
    try {
      const stored = window.sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : EMPTY_ADDRESS_FILTER;
    } catch {
      return EMPTY_ADDRESS_FILTER;
    }
  });

  const setFilter = (next: AddressFilter) => {
    setFilterState(next);
    try {
      if (countAddressFilters(next) === 0) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(next));
      }
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the
      // filter still works for as long as the component stays mounted.
    }
  };

  return [filter, setFilter] as const;
};

export default useAddressFilter;
