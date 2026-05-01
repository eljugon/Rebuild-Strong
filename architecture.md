"}
# Architecture Plan

## Current
- Single index.html
- UI + data + logic mixed

## Target

### Layers

1. Data
- program.json
- exercises.json

2. UI
- Components (Week, Session, Blocks)

3. Logic
- Progress tracking
- Load calculation
- Export

4. Storage
- LocalStorage / IndexedDB
- Future: Cloud sync

---

## Future iOS Architecture

- SwiftUI
- SwiftData
- CloudKit (optiona