// REMOVED in Phase 1. This file is a tombstone, not a module anyone imports.
//
// It used to hold types, seed values and formatting helpers in one place. That
// is now three files:
//
//   lib/types.ts       every type, no values
//   lib/format.ts      usdt, pct, stamp
//   lib/data/seed.json the seed values as data
//   lib/data/seed.ts   the seed values with their types back on, plus lookups
//
// Read through lib/adapter.ts rather than importing the seed directly. Nothing
// in the repo imports this file. The runner should `git rm lib/data.ts`; the
// Phase 1 agent had no shell and could not remove it itself.

export {};
