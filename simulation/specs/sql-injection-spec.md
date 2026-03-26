# SQL Injection Simulation Spec

## 1. Purpose

This simulation demonstrates a simple login attack where an attacker tricks a weak application into granting access without knowing a real password. It then shows how the protected version blocks the same attack and produces visible proof.

The demo is for expo visitors, so it should feel immediate, visual, and understandable in under one minute.

---

## 2. Story Theme

### Theme
Campus staff portal login

### Story
A college has a "Staff Attendance Portal" for administrators. A normal staff member logs in with a username and password. An attacker tries to bypass the login box by typing a malicious input instead of a real password.

### Why this theme works
- Everyone understands a login screen.
- "Getting in without the real password" is easy to grasp.
- It maps naturally to SQL injection without requiring database knowledge.
- It creates a clear before/after security story.

### Suggested on-screen title
`SQL Injection Demo: Fake Login Trick vs Protected Login`

### Suggested subtitle
`See how one malicious input can fool a weak login, and how protection stops it.`

---

## 3. Why Layman Visitors Will Understand It

The demo should explain SQL injection in plain language:

- The attacker is not "hacking by magic"; they are sending a specially crafted input.
- The weak app wrongly treats the input as part of its database instruction.
- The result is simple: the app says "login successful" even though no real password was given.
- The protected version treats the input as suspicious and blocks it.

### Layman explanation to embed on screen

`Think of the login box like a receptionist taking your name and password.`

`In the weak version, the receptionist gets confused by a trick sentence and opens the door anyway.`

`In the protected version, the bad input is recognized and blocked before access is granted.`

---

## 4. Demo Goals

The simulation must make these points obvious:

1. A normal login should work in both modes.
2. A malicious login should succeed when protection is OFF.
3. The exact same malicious login should fail when protection is ON.
4. Visitors should see proof, not just hear a claim.
5. The demo should clearly separate the simulated vulnerable app from any real secure platform components.

---

## 5. Scope

This is a custom simulation inside `simulation`.

It is not a real vulnerable login against the main project.

It may visually reference the project's protection concepts, but it must not require modifying or weakening the real platform.

---

## 6. Screen Layout

Use a single-page layout optimized for a laptop screen at an expo table.

### Layout structure

#### A. Top header
- Demo title
- One-line explanation
- Protection toggle badge:
  - `Protection OFF`
  - `Protection ON`
- Reset button

#### B. Left panel: Login simulation
- Small card titled `Staff Attendance Portal`
- Username field
- Password field
- Primary button: `Login`
- Quick-fill buttons:
  - `Fill Normal User`
  - `Fill Attack Input`
- Result banner area directly below the form

#### C. Center panel: "What the app is doing"
- A simple step-by-step request visual
- Suggested sub-sections:
  - `User Input`
  - `Query Built By App`
  - `Decision`
- In OFF mode, show the unsafe query assembly
- In ON mode, show safe handling / blocked request explanation

#### D. Right panel: Proof panel
- Card titled `Visible Proof`
- Sections:
  - `Current Outcome`
  - `Attack Status`
  - `Security Event`
  - `Access Granted To`
- When protected, this becomes the proof of blocking
- When unprotected, this becomes the proof of unauthorized access

#### E. Bottom strip
- Tiny legend or helper note:
  - green = allowed normal action
  - red = suspicious or blocked
  - yellow = vulnerable behavior

### Visual behavior
- Keep one screen only; do not require page changes.
- The login card should be clean and familiar.
- The proof panel should use strong colors and large labels so distant viewers can follow.
- The query panel should avoid dense technical syntax walls.

---

## 7. Exact User Flow

This is the normal visitor-safe flow.

### Initial state
- Protection defaults to `OFF` or has an obvious toggle the presenter can switch.
- Fields are empty.
- Result area says `Waiting for login attempt`.
- Proof panel says `No action yet`.

### Normal user example

Use a fixed normal credential pair for the simulation:
- Username: `admin`
- Password: `admin123`

### Normal flow steps

1. Presenter clicks `Fill Normal User`.
2. Username becomes `admin`.
3. Password becomes `admin123`.
4. Presenter clicks `Login`.
5. App shows success in both protection states.

### Expected on-screen results for normal flow

#### In Protection OFF
- Result banner: `Login successful`
- Access granted label: `Admin Dashboard`
- Query panel shows a normal query built from the provided fields
- Proof panel shows:
  - `Current Outcome: Allowed`
  - `Attack Status: No attack detected`
  - `Security Event: None`

#### In Protection ON
- Same login success
- Proof panel shows:
  - `Current Outcome: Allowed`
  - `Attack Status: Normal request`
  - `Security Event: Clean request passed`

### Why normal flow matters

Visitors should see that protection is not "blocking everything." Normal usage still works.

---

## 8. Exact Attacker Flow

The attacker flow must be fast and repeatable.

### Attack payload choice

Use a classic SQL injection style password payload that laymen can recognize as "weird input":

- Username: `admin`
- Password: `' OR '1'='1`

This is better for the expo than longer payloads because it is readable on screen.

### Quick-fill attack behavior

When the presenter clicks `Fill Attack Input`:
- Username field becomes `admin`
- Password field becomes `' OR '1'='1`

### Attacker flow steps in vulnerable mode

1. Presenter ensures protection is `OFF`.
2. Presenter clicks `Fill Attack Input`.
3. Presenter clicks `Login`.
4. App animates the request into the center panel.
5. Center panel shows the weak query being assembled using raw input.
6. App returns an incorrect success state.
7. Proof panel shows that access was granted without a real password.

### Exact vulnerable behavior to simulate

The center panel should show a simplified unsafe query such as:

`SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1'`

Then show a plain-language note:

`Because '1'='1' is always true, the weak app treats this as a valid match.`

### Vulnerable outcome text

- Result banner: `Login successful`
- Secondary warning text: `Access granted by manipulated input`
- Access granted label: `Admin Dashboard (unauthorized)`
- Proof panel:
  - `Current Outcome: Unauthorized access allowed`
  - `Attack Status: Attack succeeded`
  - `Security Event: No blocking protection`

### Attacker flow steps in protected mode

1. Presenter switches protection to `ON`.
2. Presenter clicks `Fill Attack Input`.
3. Presenter clicks `Login`.
4. App animates the request into the center panel.
5. Center panel shows that suspicious input is detected before login completes.
6. Login is denied.
7. Proof panel shows a blocked event with security details.

### Exact protected behavior to simulate

The center panel should show either:
- a safe parameterized-query explanation, or
- a WAF/input-validation interception step before the database stage

For this expo simulation, show both in simple form:

1. `Suspicious pattern detected in password input`
2. `Request blocked before unsafe query can run`

Optional small technical note:

`In real secure systems, parameterized queries and request filtering prevent this trick from changing the query logic.`

### Protected outcome text

- Result banner: `Login blocked`
- Secondary warning text: `Suspicious input was stopped`
- Access granted label: `No access granted`
- Proof panel:
  - `Current Outcome: Attack blocked`
  - `Attack Status: SQL injection attempt detected`
  - `Security Event: Blocked by protection layer`

---

## 9. Before/After Protection Behavior

The exact same attack input must produce opposite outcomes.

### Protection OFF

Behavior:
- Raw input is treated as part of the query logic
- Attack bypasses password check
- Fake success is shown
- No security alert is shown

Visitor takeaway:
- `The weak app can be fooled into opening the door.`

### Protection ON

Behavior:
- Suspicious pattern is flagged
- Attack never reaches successful login
- Visible blocking message appears
- Security event proof is shown

Visitor takeaway:
- `The protected app recognizes the trick and refuses entry.`

### Side-by-side messaging rule

Even if the UI is not literally side-by-side, the language must strongly reinforce:
- `Same input`
- `Different result`
- `Protection is the reason`

---

## 10. What Is Fake vs What Connects To The Real Platform

This section is important so future builders do not accidentally wire the demo to real authentication logic.

### Fully fake / simulated
- Login form
- User database
- Credential validation
- Query construction display
- Attack detection logic for the custom demo
- Success/failure result states
- Proof counters or event cards inside the simulation

### Can visually reference the real platform
- Naming like `WAF`, `gateway`, or `security event`
- Color language and security terminology aligned with the real project
- Optional screenshot-inspired styling if later desired

### Should not directly connect to the real platform in the first build
- Main project login
- Main project backend
- Real user database
- Real deployment environment
- Real authentication session
- Real service credentials

### Optional future connection

If the team later wants stronger proof, the simulation may show a mirrored "inspired by platform WAF event" panel, but this spec assumes the SQLi demo is self-contained and safe.

---

## 11. What Proof Should Appear On Screen

The proof must be visible enough that a passerby can understand the result without reading code.

### Required proof in vulnerable mode

Show all of these after the attack succeeds:

1. Large status badge:
   - `Unauthorized Access Allowed`

2. Access destination label:
   - `Opened: Admin Dashboard`

3. Warning card:
   - `No real password was used`

4. Query explanation:
   - The malicious input changed the login logic

### Required proof in protected mode

Show all of these after the attack is blocked:

1. Large status badge:
   - `Attack Blocked`

2. Security event card with fields:
   - `Threat: SQL Injection`
   - `Input Field: Password`
   - `Action: Blocked`
   - `Reason: Suspicious login payload`

3. Access result:
   - `No dashboard access`

4. Optional counter:
   - `Blocked attacks: 1`

### Strong recommendation

Include a tiny activity log with one-line event entries such as:
- `Normal login allowed`
- `SQL injection attempt allowed (vulnerable mode)`
- `SQL injection attempt blocked (protected mode)`

This will make the demo easier to repeat in front of multiple visitors.

---

## 12. Presenter Script

Target length: 30 to 60 seconds

### Short script

`This is a simple staff login screen. A normal user signs in with the correct password, and that works as expected.`

`Now here is the attack. Instead of a real password, the attacker enters a trick input designed to confuse the database check.`

`With protection OFF, the weak app is fooled and grants access without the real password.`

`With protection ON, the exact same input is detected and blocked, and you can see the proof here in the security event panel.`

`So the key point is: same attack, different result. The protected system stops the fake login before access is granted.`

### Extra layman version if needed

`Think of it like someone using a clever sentence to confuse the guard at the door. In the weak version, the guard gets tricked. In the protected version, the trick is recognized and stopped.`

---

## 13. Detailed Interaction Script For Presenter

Use this for a repeatable expo routine.

1. Start with protection `OFF`.
2. Click `Fill Normal User`.
3. Click `Login`.
4. Say: `A real user gets in normally.`
5. Click `Reset`.
6. Click `Fill Attack Input`.
7. Click `Login`.
8. Say: `Now the attacker uses a fake password input, but the weak app still lets them in.`
9. Point to:
   - unauthorized access badge
   - query explanation
   - proof card
10. Switch protection to `ON`.
11. Click `Reset`.
12. Click `Fill Attack Input`.
13. Click `Login`.
14. Say: `Same attack, but now the protection catches it and blocks it.`
15. Point to:
   - blocked badge
   - threat type
   - no access result
   - security event card

Total demo time should be around 45 seconds.

---

## 14. Interaction Rules

To keep the demo practical and stable:

- Do not allow arbitrary attack logic execution.
- Treat the attack payload as a recognized simulated case.
- Only a small set of demo inputs needs to be supported.
- The UI should stay understandable even if the presenter types manually.

### Minimum supported manual input behaviors

If user enters:
- `admin` / `admin123` -> normal success
- `admin` / `' OR '1'='1` with protection OFF -> attack success
- `admin` / `' OR '1'='1` with protection ON -> blocked

All other inputs may produce:
- `Invalid username or password`

This keeps the build simple and reliable.

---

## 15. Exact Content Recommendations

### Login card labels
- `Username`
- `Password`
- `Login`

### Helper text under form
- `Try a normal login or a malicious input.`

### Protection toggle labels
- `Protection OFF: vulnerable demo mode`
- `Protection ON: protected demo mode`

### Status badge text options
- Green: `Allowed`
- Yellow: `Vulnerable`
- Red: `Blocked`

### Warning copy for vulnerable attack success
- `This login succeeded without the correct password.`

### Warning copy for protected block
- `Suspicious input detected. Login request blocked.`

---

## 16. Implementation Notes For Future Build

This section should be detailed enough for another agent to build directly from it.

### Suggested build style
- Single-page React UI or simple static frontend inside `simulation/demos`
- No backend required for v1
- Use local state only

### Suggested state model

Core state:
- `protectionEnabled: boolean`
- `username: string`
- `password: string`
- `mode: 'idle' | 'normal-success' | 'attack-success' | 'attack-blocked' | 'invalid'`
- `eventLog: array`
- `blockedCount: number`

Derived state:
- current query preview
- outcome badge
- proof card content

### Suggested decision logic

Pseudo-behavior:

1. If username is `admin` and password is `admin123`:
   - mode = `normal-success`

2. Else if password matches known SQLi payload pattern such as `' OR '1'='1`:
   - if protection enabled:
     - mode = `attack-blocked`
     - append blocked security event
     - increment blockedCount
   - else:
     - mode = `attack-success`
     - append vulnerable success event

3. Else:
   - mode = `invalid`

### Suggested proof data structure

Each event log entry may include:
- `timestampLabel`
- `type`
- `status`
- `message`

Examples:
- `Normal Login | Allowed | admin signed in successfully`
- `SQL Injection | Allowed | malicious input bypassed weak login`
- `SQL Injection | Blocked | suspicious payload stopped before access`

### Query panel recommendations

Do not render long raw SQL blocks everywhere.

Instead:
- Show one simplified query line in vulnerable mode
- Show one simplified "blocked before query" explanation in protected mode
- Highlight the injected text in a contrasting color

### Animation recommendations

Keep animations light:
- button click
- request flowing from login card to query panel
- outcome badge fade/slide

Avoid flashy effects that reduce clarity.

### Reset behavior

`Reset` should:
- clear username/password
- return result to idle
- keep protection toggle in its current state
- optionally preserve the activity log for the current session

### Accessibility and expo practicality

- Large font for status badges
- High contrast colors
- Clear labels for distant viewers
- Minimal scrolling
- Usable with mouse only

### Safety note

Do not run real SQL.
Do not connect to a real database.
Do not embed an actual vulnerable query executor.
This demo is educational simulation only.

---

## 17. Non-Goals

The first version should not try to:
- teach full SQL syntax
- support many payload variations
- connect to the real authentication system
- behave like a real penetration testing tool
- explain every database concept in detail

The goal is clarity, not completeness.

---

## 18. Acceptance Criteria

This spec is considered successfully implemented later only if:

1. A visitor can watch the full demo in under 60 seconds.
2. A normal login works in both OFF and ON modes.
3. The attack payload succeeds in OFF mode.
4. The same attack payload is blocked in ON mode.
5. The screen clearly proves what happened after each attempt.
6. It is obvious that the simulation is safe and self-contained.
7. Another agent can build the demo without guessing missing behavior.

---

## 19. Recommended File Target For Future Build

Suggested future structure only:

- `simulation/demos/sql-injection/`
- `simulation/demos/sql-injection/README.md`
- `simulation/demos/sql-injection/src/...`

This spec itself should remain the source of truth for the demo behavior.
