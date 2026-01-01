import type { typeInterface, unitDetails } from "../../interface";

export const mockTerritoryType: typeInterface = {
  id: "type-1",
  code: "HDB"
};

export const mockTerritoryTypePrivate: typeInterface = {
  id: "type-2",
  code: "Private"
};

export const mockUnit: unitDetails = {
  id: "unit-1",
  number: "01-01",
  note: "Test note",
  type: [mockTerritoryType],
  status: "Inactive",
  nhcount: "0",
  dnctime: 0,
  floor: 1,
  sequence: 1,
  coordinates: { lat: 1.3521, lng: 103.8198 }
};

export const mockUnitWithMultipleTypes: unitDetails = {
  id: "unit-2",
  number: "02-01",
  note: "Multiple types",
  type: [mockTerritoryType, mockTerritoryTypePrivate],
  status: "Active",
  nhcount: "2",
  dnctime: 0,
  floor: 2,
  sequence: 2,
  coordinates: { lat: 1.3522, lng: 103.8199 }
};

export const mockTerritory = {
  id: "territory-1",
  code: "T01",
  name: "Test Territory",
  congregation: "cong-1",
  created: "2024-01-01T00:00:00.000Z",
  updated: "2024-01-01T00:00:00.000Z"
};

export const mockTerritoryList = [
  mockTerritory,
  {
    id: "territory-2",
    code: "T02",
    name: "Second Territory",
    congregation: "cong-1",
    created: "2024-01-02T00:00:00.000Z",
    updated: "2024-01-02T00:00:00.000Z"
  },
  {
    id: "territory-3",
    code: "T03",
    name: "Third Territory",
    congregation: "cong-1",
    created: "2024-01-03T00:00:00.000Z",
    updated: "2024-01-03T00:00:00.000Z"
  }
];

export const mockMap = {
  id: "map-1",
  name: "Block 123",
  territory: "territory-1",
  sequence: 1,
  created: "2024-01-01T00:00:00.000Z",
  updated: "2024-01-01T00:00:00.000Z"
};

export const mockAddress = {
  id: "address-1",
  name: "Block 123",
  postalCode: "123456",
  map: "map-1",
  sequence: 1,
  coordinates: { lat: 1.3521, lng: 103.8198 },
  created: "2024-01-01T00:00:00.000Z",
  updated: "2024-01-01T00:00:00.000Z"
};
