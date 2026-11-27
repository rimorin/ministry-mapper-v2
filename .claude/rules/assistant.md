---
paths:
  - "src/hooks/useAssistant.ts"
  - "src/utils/assistant*.ts"
  - "src/components/modal/assistant*"
  - "src/components/common/assistant-*"
---

# Admin AI assistant

- Backend routes: `/assistant/ask`, `/assistant/history`, `/assistant/feedback`. Actions the user confirms run in `src/utils/assistantActions.ts`, which writes records directly (not through SmartSync) and supports undo.
- The `enable-publisher-role` flag goes to the assistant as `memberLinks`: its share-link cards then carry `people` (user ids the backend matched), the card picks accounts from the roster `useAssistant` loads, and the confirmed pairings go back with the card's outcome.
- Link cards in one answer can be confirmed together ("Confirm all"); they run one after another on purpose, since each quick link is given the map with the fewest people on it.
- A quick-link card says where its map is looked for from (`data.near_me`, `data.origin` for a named place, `data.together` for the first map its answer gave out); the card only passes that point as `coordinates`, and the backend measures.
