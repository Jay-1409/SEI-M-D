# Decisions Log

This file records important decisions for the simulation workspace so future agents do not re-decide settled items.

---

## Decision 1

### Topic
Main project modification policy

### Decision
Do not modify the main project code or main folders. Only work inside `simulation`.

### Reason
The user explicitly wants the original project kept untouched.

---

## Decision 2

### Topic
Overall simulation strategy

### Decision
Not every functionality needs a custom coded simulation.

### Reason
Some features are already visual enough in the existing platform and can be demonstrated with prepared services and a good presentation flow.

---

## Decision 3

### Topic
Features that need custom simulations

### Decision
These should be implemented as custom demos inside `simulation`:
- SQL injection
- XSS
- Rate limiting
- API key protection

### Reason
These are easier for layman visitors to understand when wrapped in a familiar story and a simple interface.

---

## Decision 4

### Topic
Features that can be shown using the real platform

### Decision
These should generally be shown using the existing project UI plus prepared sample services:
- image upload and inspection
- deployment flow
- gateway access
- Trivy scan
- Nikto scan
- OpenAPI detection
- service controls
- WAF logs and statistics

### Reason
These already have visual UI or visible outputs in the current project.

---

## Decision 5

### Topic
Expo storytelling style

### Decision
Use simple, familiar, real-world analogies and layman language.

### Examples
- gateway = main building gate
- API key = access card
- rate limiting = fair queue / ticket counter
- SQLi = fake login trick
- XSS = dangerous code hidden in a public comment

### Reason
The target audience includes non-technical expo visitors.

---

## Decision 6

### Topic
Initial demo priority

### Decision
Highest-priority demos are:
- SQL injection
- XSS
- Rate limiting
- Trivy comparison flow
- WAF logs/stats support flow

### Reason
These are the easiest to explain and likely to create the strongest visitor engagement.

---

## Decision 7

### Topic
Documentation-first workflow

### Decision
Before building a demo, create its detailed spec first.

### Reason
This makes parallel agent work safer and makes future-chat continuation more reliable.

---

## Decision 8

### Topic
Expo integration approach

### Decision
Use a shared launcher and light navigation polish instead of rewriting the already-built demo flows.

### Reason
The custom demos already follow a compatible single-page, story-first pattern. A shared entry point and consistent navigation improve presentation smoothness without risking unnecessary breakage.
