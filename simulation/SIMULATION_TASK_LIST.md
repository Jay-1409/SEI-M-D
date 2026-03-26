# Simulation Task List

This file is the execution checklist for building and polishing expo simulations inside the `simulation` folder only.

Rules:
- Do not modify the main project code or folders.
- All new files, assets, scripts, notes, and demo apps must stay inside `simulation`.
- A main task is considered complete only when all its subtasks are complete.

Status legend:
- `[ ]` not started
- `[-]` in progress
- `[x]` complete

---

## 1. Project Control And Continuity

- [x] 1.1 Create `simulation/README.md`
- [x] 1.2 Create `simulation/HANDOFF.md`
- [x] 1.3 Create `simulation/DECISIONS.md`
- [x] 1.4 Define the folder structure for demos, assets, scripts, and specs
- [x] 1.5 Add a demo status table

## 2. Master Demo Roadmap

- [x] 2.1 Create roadmap file listing all planned demos
- [x] 2.2 Classify each item by demo type
- [x] 2.3 Mark recommended build order
- [x] 2.4 Mark parallelizable work streams
- [x] 2.5 Mark dependencies between demos

## 3. SQL Injection Simulation Spec

- [x] 3.1 Story theme
- [x] 3.2 Screen layout
- [x] 3.3 Normal user flow
- [x] 3.4 Attacker flow
- [x] 3.5 Before/after protection behavior
- [x] 3.6 Fake vs real platform boundary
- [x] 3.7 Visible proof definition
- [x] 3.8 Presenter script
- [x] 3.9 Implementation notes

## 4. SQL Injection Simulation Build

- [x] 4.1 Folder and file structure
- [x] 4.2 Demo UI
- [x] 4.3 Normal login behavior
- [x] 4.4 Attack payload behavior
- [x] 4.5 Protection OFF state
- [x] 4.6 Protection ON state
- [x] 4.7 Clear visitor explanation text
- [x] 4.8 Proof panel
- [ ] 4.9 Manual browser sanity test
- [x] 4.10 Run/presenter documentation

## 5. XSS Simulation Spec

- [x] 5.1 Story theme
- [x] 5.2 Screen layout
- [x] 5.3 Normal comment flow
- [x] 5.4 Malicious payload flow
- [x] 5.5 Before/after protection behavior
- [x] 5.6 Fake vs real platform boundary
- [x] 5.7 Visible proof definition
- [x] 5.8 Presenter script
- [x] 5.9 Implementation notes

## 6. XSS Simulation Build

- [x] 6.1 Folder and file structure
- [x] 6.2 Demo UI
- [x] 6.3 Normal comment behavior
- [x] 6.4 Malicious payload behavior
- [x] 6.5 Protection OFF state
- [x] 6.6 Protection ON state
- [x] 6.7 Clear visitor explanation text
- [x] 6.8 Proof panel
- [ ] 6.9 Manual browser sanity test
- [x] 6.10 Run/presenter documentation

## 7. Rate Limiting Simulation Spec

- [x] 7.1 Story theme
- [x] 7.2 Screen layout
- [x] 7.3 Normal usage flow
- [x] 7.4 Spam flood flow
- [x] 7.5 Before/after rate limit behavior
- [x] 7.6 Fake vs real platform boundary
- [x] 7.7 Visible proof definition
- [x] 7.8 Presenter script
- [x] 7.9 Implementation notes

## 8. Rate Limiting Simulation Build

- [x] 8.1 Folder and file structure
- [x] 8.2 Demo UI
- [x] 8.3 Normal request behavior
- [x] 8.4 Spam request behavior
- [x] 8.5 Rate limit OFF state
- [x] 8.6 Rate limit ON state
- [x] 8.7 Clear visitor explanation text
- [x] 8.8 Proof panel
- [ ] 8.9 Manual browser sanity test
- [x] 8.10 Run/presenter documentation

## 9. API Key Protection Simulation Spec

- [x] 9.1 Story theme
- [x] 9.2 Screen layout
- [x] 9.3 Public route flow
- [x] 9.4 Protected route flow
- [x] 9.5 Missing key behavior
- [x] 9.6 Valid key behavior
- [x] 9.7 Fake vs real platform boundary
- [x] 9.8 Visible proof definition
- [x] 9.9 Presenter script
- [x] 9.10 Implementation notes

## 10. API Key Protection Simulation Build

- [x] 10.1 Folder and file structure
- [x] 10.2 Demo UI
- [x] 10.3 Public route interaction
- [x] 10.4 Protected route interaction
- [x] 10.5 No-key failure state
- [x] 10.6 Valid-key success state
- [x] 10.7 Layman-friendly explanation text
- [x] 10.8 Proof panel
- [ ] 10.9 Manual browser sanity test
- [x] 10.10 Run/presenter documentation

## 11. Trivy Real-Platform Demo Spec

- [x] 11.1 Image/service choice
- [x] 11.2 Exact operator steps
- [x] 11.3 Visitor-facing explanation
- [x] 11.4 Visible on-screen results
- [x] 11.5 Comparison story
- [x] 11.6 Presenter script
- [x] 11.7 Setup instructions

## 12. Deployment And Gateway Real-Platform Demo Spec

- [x] 12.1 Sample service choice
- [x] 12.2 Exact deployment flow
- [x] 12.3 Gateway-only explanation
- [x] 12.4 URLs and pages to show
- [x] 12.5 Simple analogy
- [x] 12.6 Presenter script
- [x] 12.7 Setup instructions

## 13. Nikto Real-Platform Demo Spec

- [x] 13.1 Sample deployed service choice
- [x] 13.2 Exact scan flow
- [x] 13.3 Layman explanation
- [x] 13.4 Visible findings/statuses
- [x] 13.5 Presenter script
- [x] 13.6 Setup instructions

## 14. WAF Logs And Dashboard Demo Spec

- [x] 14.1 Support flow for SQLi/XSS demos
- [x] 14.2 Metrics and event cards to point out
- [x] 14.3 Clear-logs/reset flow
- [x] 14.4 Presenter script
- [x] 14.5 Setup instructions

## 15. Optional Dangerous Headers Demo Spec

- [ ] 15.1 Decide whether to include it
- [ ] 15.2 Choose simplest story and analogy
- [ ] 15.3 Define proof method
- [ ] 15.4 Presenter script
- [ ] 15.5 Implementation notes

## 16. Shared Visual Design System For Simulations

- [-] 16.1 Define shared visual style across built demos
- [-] 16.2 Define shared navigation and entry-point conventions
- [-] 16.3 Define common message patterns
- [-] 16.4 Define common layout expectations for expo laptop screens
- [-] 16.5 Define reusable proof-oriented conventions

Note:
- This is partially satisfied through the existing demo patterns plus launcher/navigation polish, but it is not yet formalized as a standalone design-system doc.

## 17. Shared Demo Launcher / Navigation

- [x] 17.1 Decide whether launcher is needed
- [x] 17.2 Define launcher information architecture
- [x] 17.3 List demos and real-platform guides that appear in it
- [x] 17.4 Implement launcher behavior
- [x] 17.5 Add lightweight back-to-launcher navigation to built demos

## 18. Presenter Playbook

- [x] 18.1 20-second project introduction
- [x] 18.2 Short explanation for each major demo
- [x] 18.3 Full 3-5 minute guided route
- [x] 18.4 Short fast route
- [x] 18.5 Likely visitor questions
- [x] 18.6 Likely faculty/judge questions

## 19. Expo Setup And Runbook

- [x] 19.1 Pre-expo setup checklist
- [x] 19.2 Start-of-day checklist
- [x] 19.3 Between-visitors reset checklist
- [x] 19.4 Troubleshooting checklist
- [x] 19.5 Minimum viable fallback plan

## 20. Final Integration Review

- [x] 20.1 Verify all current specs are present
- [x] 20.2 Verify all built demos are present
- [x] 20.3 Verify docs are updated
- [x] 20.4 Verify task statuses are accurate
- [x] 20.5 Verify handoff clearly states what is complete and what remains
- [x] 20.6 Verify all work stayed inside `simulation`

## Remaining Practical Gaps

- [ ] Manual browser sanity pass for all four built custom demos
- [ ] Optional supporting guides for OpenAPI detection and service controls
- [ ] Optional dangerous-headers inclusion decision
- [ ] Final expo-machine rehearsal of the full route
