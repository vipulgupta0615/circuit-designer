# Requirements gap analysis

Audit performed against the repository state before this implementation pass. “Complete” means a working behavior was inspected or verified, not merely a visible control.

| Assignment requirement | Initial implementation | Initial status | Required change | Priority | Verification |
| --- | --- | --- | --- | --- | --- |
| 3D component editor / transforms / camera | R3F scene, orbit controls, transform controls, component sidebar | Partial | Preserve and make wires follow transforms; protect read-only views | P0 | Type check, manual scene QA |
| Pin-level wiring | Two-click pins and structured connections | Partial | Validate component/pin IDs, NC pins, duplicates; feedback | P0 | `verify-simulation.ts`, editor workflow |
| Breadboard connectivity | Row strips existed; rails were described but not rendered/resolved | Partial | Render interactive rails and resolve terminal/rail nets | P0 | Starter simulation test |
| Circuit graph / diagnostics | Inlined graph only in simulation; no short detector | Partial | Extract graph + validator with diagnostics | P0 | Starter, short, and disconnection tests |
| ESP32 GPIO | GPIO toggles existed | Partial | Add INPUT/OUTPUT modes and simulation logs | P0 | Console workflow / simulation test |
| DHT22 simulation | Fixed reading plus offsets | Partial | Persist user-configurable environment values; require actual nets | P0 | Starter simulation test |
| LED/resistor simulation | Basic path heuristic | Partial | Require resistor in GPIO2-to-anode path and cathode ground path | P0 | Disconnected LED test |
| Simulation lifecycle/console | Start/stop/reset and logs | Partial | Add structured diagnostics and events from the controller | P0 | UI/manual test |
| Component registry | No single registry | Missing | Add typed registry used for default parts and pin validation | P1 | Type check |
| MongoDB CRUD | Create/list/read/update | Partial | Add schema metadata, stronger validation, and delete | P0 | Server tests / API test with MongoDB |
| Safe public sharing | Project ID copied into URL | Broken | Add random share tokens and public read-only project mode | P0 | API/manual test with MongoDB |
| Import/export/sample | Import/export existed; sample bypassed breadboard nets | Partial | Add schema/settings and breadboard-routed sample | P1 | Import workflow |
| Automated validation | Builds only | Partial | Add deterministic simulation and server payload tests | P1 | Commands in README |
| Documentation/deployment prep | Brief README | Partial | Document architecture, model limits, APIs, env, run/test/deploy | P1 | README review |
| Live URL/video | No credentials or published service | Missing external authority | Provide deployment/runbook; do not fabricate deliverables | External blocker | Deployment owner action |
