---
applyTo:
  - "src/utils/pocketbase.ts"
  - "src/hooks/**"
  - "src/pages/**"
  - "src/components/table/**"
---

# PocketBase Integration & Real-time Data

> **Related Instructions**:
>
> - [architecture.instructions.md](./architecture.instructions.md) - Data models
> - [react-hooks.instructions.md](./react-hooks.instructions.md) - Custom hooks

## PocketBase Overview

This project uses **PocketBase 0.26.x** as the backend-as-a-service for:

- Data storage and queries
- Authentication (email/password, OAuth2, OTP)
- Real-time subscriptions
- File storage

🔴 **CRITICAL**: ALWAYS use utility functions from `src/utils/pocketbase.ts`. NEVER use the PocketBase client directly.

## Data Fetching

### getList - Fetch Multiple Records

```typescript
import { getList } from "../../utils/pocketbase";
import { PB_FIELDS } from "../../utils/constants";

// Fetch territories for a congregation
const territories = await getList("territories", {
  filter: `congregation="${congregationCode}"`,
  sort: "+code", // + for ascending, - for descending
  requestKey: `territories-${congregationCode}`, // Prevents duplicate requests
  fields: PB_FIELDS.TERRITORIES // Only fetch needed fields
});

// With pagination
const addresses = await getList("addresses", {
  filter: `map="${mapId}"`,
  page: 1,
  perPage: 50,
  requestKey: `addresses-${mapId}`,
  fields: PB_FIELDS.ADDRESSES
});
```

### getDataById - Fetch Single Record

```typescript
import { getDataById } from "../../utils/pocketbase";

// Fetch specific territory
const territory = await getDataById("territories", territoryId, {
  requestKey: `territory-${territoryId}`,
  fields: PB_FIELDS.TERRITORIES
});

// Fetch with expand (related records)
const address = await getDataById("addresses", addressId, {
  expand: "map,units",
  requestKey: `address-${addressId}`
});
```

### callFunction - Custom Endpoints

```typescript
import { callFunction } from "../../utils/pocketbase";

// POST request
await callFunction("/territory/reset", {
  method: "POST",
  body: { territory: territoryId }
});

// GET request
const stats = await callFunction("/territory/stats", {
  method: "GET",
  query: { congregationCode }
});
```

## Real-time Subscriptions

🔴 **CRITICAL**: Always cleanup subscriptions on component unmount.

### Basic Subscription

```typescript
import { useEffect } from "react";
import { setupRealtimeListener, unsubscriber } from "../../utils/pocketbase";
import { PB_FIELDS } from "../../utils/constants";

useEffect(() => {
  if (!mapId) return;

  const subOptions = {
    filter: `map="${mapId}"`,
    requestKey: null,
    fields: PB_FIELDS.ADDRESSES
  };

  setupRealtimeListener(
    "addresses", // Collection name
    (data) => {
      const addressId = data.record.id;
      const action = data.action; // "create", "update", "delete"

      if (action === "create") {
        // Handle new record
        setAddresses((prev) => [...prev, data.record]);
      } else if (action === "update") {
        // Handle update
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === addressId ? data.record : addr))
        );
      } else if (action === "delete") {
        // Handle deletion
        setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      }
    },
    subOptions
  );

  // Cleanup subscription on unmount
  return () => {
    unsubscriber(["addresses"]);
  };
}, [mapId]);
```

### Multiple Subscriptions

```typescript
useEffect(() => {
  // Subscribe to territories
  setupRealtimeListener("territories", handleTerritoryChange, {
    filter: `congregation="${congregationCode}"`
  });

  // Subscribe to maps
  setupRealtimeListener("maps", handleMapChange, {
    filter: `territory="${territoryId}"`
  });

  // Cleanup both subscriptions
  return () => {
    unsubscriber(["territories", "maps"]);
  };
}, [congregationCode, territoryId]);
```

### Subscription with Custom Headers

For link-based access (assignments):

```typescript
import { setupRealtimeListener } from "../../utils/pocketbase";

// Set custom auth header
const customHeaders = {
  "X-PB-TOKEN": assignmentToken
};

setupRealtimeListener("addresses", handleAddressUpdate, {
  filter: `map="${mapId}"`,
  headers: customHeaders
});
```

## Data Mutations

### Create Record

```typescript
import { createRecord } from "../../utils/pocketbase";

const newTerritory = await createRecord("territories", {
  code: "T-01",
  name: "Territory 01",
  congregation: congregationId
});
```

### Update Record

```typescript
import { updateRecord } from "../../utils/pocketbase";

await updateRecord("addresses", addressId, {
  status: STATUS_CODES.DONE,
  lastUpdated: new Date().toISOString()
});
```

### Delete Record

```typescript
import { deleteRecord } from "../../utils/pocketbase";

await deleteRecord("territories", territoryId);
```

## Authentication

### Sign In

```typescript
import { signIn } from "../../utils/pocketbase";

try {
  const authData = await signIn(email, password);
  // User is authenticated
} catch (error) {
  errorHandler(error);
}
```

### Sign Out

```typescript
import { signOut } from "../../utils/pocketbase";

signOut();
// User is logged out
```

### Get Current User

```typescript
import { getCurrentUser } from "../../utils/pocketbase";

const user = getCurrentUser();
if (user) {
  console.log("Logged in as:", user.email);
}
```

### OAuth2 Authentication

```typescript
import { oauth2SignIn } from "../../utils/pocketbase";

// Google OAuth2
const authData = await oauth2SignIn("google");
```

## Field Projections

🟡 **IMPORTANT**: Use field projections to minimize data transfer.

```typescript
import { PB_FIELDS } from "../../utils/constants";

// Only fetch specific fields
const territories = await getList("territories", {
  fields: PB_FIELDS.TERRITORIES // "id,code,name,congregation"
});

// Available field constants:
// - PB_FIELDS.TERRITORIES
// - PB_FIELDS.MAPS
// - PB_FIELDS.ADDRESSES
// - PB_FIELDS.USERS
// - PB_FIELDS.CONGREGATIONS
// - PB_FIELDS.ASSIGNMENTS
```

## Request Deduplication

🟡 **IMPORTANT**: Use `requestKey` to prevent duplicate requests.

```typescript
// First call - makes request
const data1 = await getList("territories", {
  filter: `congregation="${code}"`,
  requestKey: `territories-${code}` // Cache key
});

// Second call with same key - returns cached result
const data2 = await getList("territories", {
  filter: `congregation="${code}"`,
  requestKey: `territories-${code}` // Returns cached data
});
```

## Error Handling

🔴 **CRITICAL**: Always use errorHandler for PocketBase errors.

```typescript
import errorHandler from "../../utils/helpers/errorhandler";

try {
  await updateRecord("territories", territoryId, data);
} catch (error) {
  errorHandler(error); // Handles PocketBase errors, Sentry logging, user feedback
}
```

## Common PocketBase Patterns

### Fetch and Subscribe

```typescript
useEffect(() => {
  // Initial fetch
  const fetchData = async () => {
    try {
      const data = await getList("territories", {
        filter: `congregation="${congregationCode}"`,
        requestKey: `territories-${congregationCode}`
      });
      setTerritories(data.items);
    } catch (error) {
      errorHandler(error);
    }
  };

  fetchData();

  // Subscribe to changes
  setupRealtimeListener(
    "territories",
    (data) => {
      if (data.action === "create") {
        setTerritories((prev) => [...prev, data.record]);
      } else if (data.action === "update") {
        setTerritories((prev) =>
          prev.map((t) => (t.id === data.record.id ? data.record : t))
        );
      } else if (data.action === "delete") {
        setTerritories((prev) => prev.filter((t) => t.id !== data.record.id));
      }
    },
    {
      filter: `congregation="${congregationCode}"`
    }
  );

  return () => {
    unsubscriber(["territories"]);
  };
}, [congregationCode]);
```

### Optimistic Updates

```typescript
const handleUpdateStatus = async (unitId: string, newStatus: number) => {
  // Optimistic update - update UI immediately
  setUnits((prev) =>
    prev.map((unit) =>
      unit.id === unitId ? { ...unit, status: newStatus } : unit
    )
  );

  try {
    // Update on server
    await updateRecord("addresses", unitId, { status: newStatus });
  } catch (error) {
    // Revert on error
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId ? { ...unit, status: unit.previousStatus } : unit
      )
    );
    errorHandler(error);
  }
};
```

### Batch Operations

```typescript
// Create multiple records
const createMultipleUnits = async (units: UnitData[]) => {
  const promises = units.map((unit) => createRecord("addresses", unit));

  try {
    await Promise.all(promises);
    alert(t("success.unitsCreated"));
  } catch (error) {
    errorHandler(error);
  }
};
```

## Security Best Practices

🔴 **CRITICAL**:

1. **Never expose PocketBase client** - Use utility functions only
2. **Always validate on server** - Client-side validation is not enough
3. **Use filters carefully** - Prevent unauthorized access
4. **Cleanup subscriptions** - Prevent memory leaks
5. **Use custom headers for link access** - `X-PB-TOKEN` for assignments

🟡 **IMPORTANT**:

1. Use field projections to minimize data transfer
2. Use request keys to prevent duplicate requests
3. Handle connection errors gracefully
4. Log out users on auth errors

## Common Filters

```typescript
// Exact match
filter: `congregation="${code}"`;

// Multiple conditions (AND)
filter: `congregation="${code}" && status=1`;

// Multiple conditions (OR)
filter: `status=1 || status=2`;

// Greater than / less than
filter: `created>="${date}"`;

// Contains (for text search)
filter: `name~"search term"`;

// In array
filter: `status?=[1,2,3]`;

// Not equal
filter: `status!=4`;
```

## Common Sorts

```typescript
// Ascending
sort: "+code";
sort: "+created";

// Descending
sort: "-updated";
sort: "-sequence";

// Multiple fields
sort: "+code,-created";
```

## Collections Reference

- **users** - User accounts and profiles
- **congregations** - Congregation settings
- **territories** - Territory definitions
- **maps** - Address/building records
- **addresses** - Individual units/households
- **assignments** - Territory assignment links
- **messages** - Territory feedback
- **options** - Congregation-specific options (household types)

---

**Last Updated**: October 2024  
**PocketBase Version**: 0.26.x (see backend repo)
