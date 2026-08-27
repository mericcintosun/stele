// REPLACED in Phase 2. This file is a tombstone, not a module anyone imports.
//
// The seam moved from a three method adapter to the LedgerStore interface in
// lib/store/, because the console needed writes as well as reads: spending
// quota on an accepted order, folding a closed fill onto a thesis, and holding
// the uploadAiLog queue.
//
//   lib/store/types.ts      the LedgerStore contract
//   lib/store/seed.ts       the seed implementation and the permanent fallback
//   lib/store/weex-store.ts closed fills from WEEX, attributed by client_oid
//   lib/store/index.ts      getStore(), the only module that picks between them
//
// Call getStore(). Nothing in the repo imports this file. The runner should
// `git rm lib/adapter.ts` along with `lib/data.ts`; the agent has no shell and
// no delete tool.

export {};
