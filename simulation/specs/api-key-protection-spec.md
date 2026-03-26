# API Key Protection Simulation Spec

## 1. Purpose

This simulation demonstrates that some routes are public and safe for everyone to view, while other actions should only work when the caller provides a valid API key.

The demo should make one simple idea obvious:

`An API key is like an access card for a staff-only action.`

Expo visitors should understand the story in under one minute without needing backend knowledge.

---

## 2. Story Theme

### Theme
Campus service desk with a public information screen and a staff-only action

### Story
A college has a small service portal:

- anyone can check public help-desk hours
- only authorized staff can trigger a staff-only action: `Open Lab Maintenance Panel`

The protected action requires a valid API key, which is presented as a digital staff access card.

### Why this theme works

- Visitors already understand the difference between public information and staff-only control.
- "Access card" is easier to grasp than "API credential."
- It avoids deep technical jargon while still mapping cleanly to real API protection.
- It creates a strong visual contrast between:
  - public route = open notice board
  - protected route = locked control panel

### Suggested on-screen title

`API Key Demo: Public Info vs Staff-Only Action`

### Suggested subtitle

`See why some routes stay open to everyone, while protected actions require a valid access key.`

---

## 3. Why Layman Visitors Will Understand It

The simulation should explain API keys in plain language:

- A public route is like reading a notice board in the lobby.
- A protected route is like trying to open a staff-only control room.
- The API key is like showing a valid staff card.
- Without the card, the system refuses the action.
- With the valid card, the action is allowed.

### Layman explanation to embed on screen

`Some information is meant for everyone, like office hours or public notices.`

`But sensitive actions should only work for trusted staff.`

`The API key acts like a digital access card that proves the request is allowed to do the staff-only action.`

---

## 4. Demo Goals

The simulation must make these points obvious:

1. Public routes work without any API key.
2. Protected routes fail without a key.
3. The same protected route succeeds with a valid key.
4. The screen shows clear proof of allow vs deny.
5. Visitors can see what is simulated and what represents the real platform idea.

---

## 5. Scope

This is a custom simulation inside `simulation`.

It is not a real gateway, real backend, or real secret-management system.

It should safely simulate request checking, route protection, and visible proof without calling the main project.

---

## 6. Screen Layout

Use a single-page layout designed for a laptop demo at an expo table.

### Layout structure

#### A. Top header
- Demo title
- One-line explanation
- Status badge showing:
  - `Public Route`
  - `Protected Route`
- Reset button

#### B. Left panel: Request builder
- Card title: `Service Desk Request`
- Route selector with two visible options:
  - `GET /public/help-hours`
  - `POST /staff/open-maintenance-panel`
- API key input field labeled:
  - `Access Key (optional for public route)`
- Quick-fill buttons:
  - `Use No Key`
  - `Use Valid Staff Key`
  - `Use Wrong Key`
- Primary action button:
  - `Send Request`
- Small helper text:
  - `Public info should work for everyone. Staff-only actions need a valid access key.`

#### C. Center panel: Route explanation and request flow
- Card title: `What the System Checks`
- Three stacked sections:
  - `Selected Route`
  - `Key Check`
  - `Decision`
- Public route mode explanation:
  - `This route is open to visitors. No staff key required.`
- Protected route mode explanation:
  - `This route changes something sensitive, so the system checks for a valid staff key first.`

#### D. Right panel: Visible proof
- Card title: `Visible Proof`
- Large outcome badge
- Route result line
- Access decision line
- Key status line
- Security event card
- Small event log list

#### E. Bottom education strip
- Short note explaining the analogy:
  - `Public route = lobby notice board`
  - `Protected route = staff-only room`
  - `API key = digital access card`

### Visual behavior

- Keep everything on one screen.
- Use large, readable badges for `Allowed` and `Denied`.
- Make the public/protected difference visually obvious.
- Avoid dense code walls.
- Show route names clearly enough for a presenter to point at them.

---

## 7. Public Route Flow

This flow proves that not everything should be locked down.

### Public route choice

Use:

`GET /public/help-hours`

### Public route story

Anyone should be able to view help-desk hours. This is normal, safe public information.

### Presenter steps

1. Select `GET /public/help-hours`.
2. Click `Use No Key`.
3. Click `Send Request`.

### Expected on-screen behavior

- Request panel shows the selected public route.
- Key check section says:
  - `No key required for this route`
- Decision section says:
  - `Public information returned`
- Result area shows the public data, for example:
  - `Help Desk Hours: 9:00 AM - 5:00 PM`
- Proof panel shows:
  - `Current Outcome: Allowed`
  - `Route Type: Public`
  - `Key Status: Not needed`
  - `Security Event: Public route accessed successfully`

### Visitor takeaway

`Security does not mean blocking everything. Public information can stay open while sensitive actions stay protected.`

---

## 8. Protected Route Flow

This flow is the core of the demo.

### Protected route choice

Use:

`POST /staff/open-maintenance-panel`

### Protected route story

This route represents a staff-only action that changes or unlocks something important. It must not run unless the caller proves authorization with a valid API key.

### What the action should feel like

The action should sound meaningful but easy to understand, such as:

- opening a maintenance control panel
- unlocking a staff operations screen
- enabling a staff-only admin function

The recommended label is:

`Open Lab Maintenance Panel`

This sounds like a real operational action without becoming overly technical.

### Presenter steps

1. Select `POST /staff/open-maintenance-panel`.
2. Demonstrate failure with no key.
3. Demonstrate success with the valid key.

### Protected route visual rule

Whenever the protected route is selected, the UI should clearly indicate:

- `Staff-only action`
- `Requires valid access key`

---

## 9. Behavior Without Key

This is the first important protected-route proof.

### Input state

- Route: `POST /staff/open-maintenance-panel`
- Key field: empty

### Presenter steps

1. Select the protected route.
2. Click `Use No Key`.
3. Click `Send Request`.

### Expected on-screen behavior

#### Request builder
- Key field remains empty.

#### Center panel
- `Selected Route`: `POST /staff/open-maintenance-panel`
- `Key Check`: `No access key provided`
- `Decision`: `Request denied before staff action can run`

#### Main result
- Large badge: `Denied`
- Result message: `Staff-only action blocked`
- Secondary explanation:
  - `A public visitor can view public info, but cannot run this protected action without a valid key.`

#### Proof panel
- `Current Outcome: Access denied`
- `Route Type: Protected`
- `Key Status: Missing`
- `Security Event: Protected route blocked`
- `Reason: No valid API key was presented`
- Event log entry:
  - `Protected action denied | missing key`

### Visitor takeaway

`The door stays closed when no access card is shown.`

---

## 10. Behavior With Invalid Key

This is optional in the short demo, but highly useful in the build because it shows that not every key-shaped value is accepted.

### Input state

- Route: `POST /staff/open-maintenance-panel`
- Key field: wrong value

### Recommended fake wrong key

`STAFF-KEY-DEMO-WRONG`

### Expected on-screen behavior

- Large badge: `Denied`
- Result message: `Invalid access key`
- Center panel key check:
  - `Key provided, but it does not match an authorized staff key`
- Proof panel:
  - `Current Outcome: Access denied`
  - `Key Status: Invalid`
  - `Security Event: Protected route blocked`
  - `Reason: Key check failed`

### Why include this

It helps visitors understand that:

- the system is not just checking whether the field is filled
- the system is checking whether the key is valid

---

## 11. Behavior With Valid Key

This is the success proof for the protected route.

### Recommended valid demo key

Use one fixed safe demo value:

`STAFF-ACCESS-DEMO-2026`

This is a simulated key only. It must never be described as a real credential.

### Input state

- Route: `POST /staff/open-maintenance-panel`
- Key field: `STAFF-ACCESS-DEMO-2026`

### Presenter steps

1. Select the protected route.
2. Click `Use Valid Staff Key`.
3. Click `Send Request`.

### Expected on-screen behavior

#### Center panel
- `Selected Route`: `POST /staff/open-maintenance-panel`
- `Key Check`: `Valid staff access key confirmed`
- `Decision`: `Protected action allowed`

#### Main result
- Large badge: `Allowed`
- Result message: `Maintenance panel opened`
- Secondary explanation:
  - `The system accepted the request because a valid staff key was presented.`

#### Proof panel
- `Current Outcome: Allowed`
- `Route Type: Protected`
- `Key Status: Valid`
- `Security Event: Authorized staff action completed`
- `Action Result: Maintenance panel access granted`
- Event log entry:
  - `Protected action allowed | valid staff key`

### Visitor takeaway

`The staff-only action works only after the digital access card is verified.`

---

## 12. Before/After Protection Message Pattern

This API key demo is not a "protection OFF vs protection ON" simulation like SQL injection.

Instead, the contrast is:

- public route vs protected route
- missing/invalid key vs valid key

The same message should be reinforced throughout the UI:

`Open information can stay public. Sensitive actions must require proof of access.`

### Message rule

Every protected-route result should make the cause clear:

- denied because key is missing
- denied because key is invalid
- allowed because key is valid

The proof should never feel random.

---

## 13. What Is Fake vs What Connects To The Real Platform

This section prevents accidental over-connection during the future build.

### Fully fake / simulated

- route handling in the custom demo
- API key checking logic in the custom demo
- request/response cards
- event log entries inside the simulation
- proof badges and counters
- staff-only action output
- the public help-hours response

### Can visually reference the real platform

- terms like `protected route`, `request denied`, `authorized`
- security-oriented badges, log cards, and route labels
- styling that feels consistent with the secure platform theme

### Should not directly connect to the real platform in v1

- main project backend
- real service gateway
- real environment secrets
- real API keys
- real service routes
- real authorization middleware
- any live protected admin endpoint

### Important wording rule

The demo should explicitly describe the shown key as:

`Simulated demo key for expo use`

It must never imply that a real secret is being exposed on screen.

---

## 14. What Proof Should Appear On Screen

The proof should be obvious to someone standing nearby.

### Required proof after public route success

Show all of these:

1. Large badge:
   - `Allowed`
2. Route type:
   - `Public`
3. Key status:
   - `Not needed`
4. Returned content:
   - `Help Desk Hours: 9:00 AM - 5:00 PM`

### Required proof after protected-route failure with no key

Show all of these:

1. Large badge:
   - `Denied`
2. Route type:
   - `Protected`
3. Key status:
   - `Missing`
4. Security event card:
   - `Action: Denied`
   - `Reason: No API key provided`
   - `Requested Route: /staff/open-maintenance-panel`
5. Main result:
   - `Maintenance panel did not open`

### Required proof after protected-route failure with invalid key

Show all of these:

1. Large badge:
   - `Denied`
2. Key status:
   - `Invalid`
3. Security event card:
   - `Action: Denied`
   - `Reason: Invalid API key`
4. Main result:
   - `Maintenance panel did not open`

### Required proof after protected-route success with valid key

Show all of these:

1. Large badge:
   - `Allowed`
2. Route type:
   - `Protected`
3. Key status:
   - `Valid`
4. Security event card:
   - `Action: Allowed`
   - `Reason: Valid API key confirmed`
   - `Requested Route: /staff/open-maintenance-panel`
5. Main result:
   - `Maintenance panel opened`

### Strong recommendation

Include a session event log with entries such as:

- `Public route allowed | no key required`
- `Protected route denied | missing key`
- `Protected route denied | invalid key`
- `Protected route allowed | valid key`

This will help the presenter repeat the demo cleanly for multiple visitors.

---

## 15. Presenter Script

Target length: 30 to 60 seconds

### Short script

`This demo shows the difference between a public route and a protected route. Public information, like help-desk hours, should be open to everyone, so that route works without any key.`

`But this staff-only action is different. It is like trying to enter a staff room or use a staff control panel. Without an API key, the system denies the request.`

`Now I use the valid key, which works like a digital access card. The same protected action is now allowed, and you can see the proof here in the result and security panel.`

`So the main idea is simple: public routes stay open, but sensitive actions require verified access.`

### Extra layman version if needed

`Think of it like a campus notice board versus a locked staff room. Anyone can read the notice board. Only staff with the correct card can open the staff-only door.`

---

## 16. Detailed Interaction Script For Presenter

Use this for a repeatable expo routine.

1. Start on `GET /public/help-hours`.
2. Click `Use No Key`.
3. Click `Send Request`.
4. Say: `This is public information, so it works without any key.`
5. Point to:
   - public route label
   - allowed badge
   - key status `Not needed`
6. Switch to `POST /staff/open-maintenance-panel`.
7. Click `Use No Key`.
8. Click `Send Request`.
9. Say: `This is a staff-only action, so the request is denied without an access key.`
10. Point to:
   - denied badge
   - key status `Missing`
   - security event reason
11. Click `Use Valid Staff Key`.
12. Click `Send Request`.
13. Say: `Now the system sees a valid digital access card, so the protected action is allowed.`
14. Point to:
   - allowed badge
   - key status `Valid`
   - opened maintenance panel result

Total demo time should be around 40 to 50 seconds.

---

## 17. Interaction Rules

To keep the demo stable and easy to present:

- Do not support arbitrary real authentication logic.
- Do not expose real secrets.
- Support only a small set of predictable routes and key states.
- Make route outcomes deterministic.

### Minimum supported manual input behaviors

If route is:

- `GET /public/help-hours`
  - any empty key or no key -> allowed public response

- `POST /staff/open-maintenance-panel`
  - empty key -> denied
  - `STAFF-KEY-DEMO-WRONG` -> denied
  - `STAFF-ACCESS-DEMO-2026` -> allowed

All other routes or values may safely produce:

- `Unknown route`
- `Request not supported in this demo`

This keeps the future build simple and reliable.

---

## 18. Exact Content Recommendations

### Route labels
- `GET /public/help-hours`
- `POST /staff/open-maintenance-panel`

### Input labels
- `Access Key`

### Input placeholder
- `Enter staff key for protected action`

### Quick-fill button labels
- `Use No Key`
- `Use Valid Staff Key`
- `Use Wrong Key`

### Outcome badge labels
- Green: `Allowed`
- Red: `Denied`
- Blue or neutral: `Public Route`
- Amber or strong accent: `Protected Route`

### Public-route helper copy
- `This route is open to everyone.`

### Protected-route helper copy
- `This route needs a valid staff access key.`

### Denied copy for missing key
- `No access key provided. Staff-only action blocked.`

### Denied copy for invalid key
- `The key was provided, but it is not authorized for this action.`

### Success copy for valid key
- `Valid staff key confirmed. Protected action allowed.`

---

## 19. Implementation Notes For Future Build

This section should be detailed enough for another agent to build directly from it.

### Suggested build style

- Single-page React UI or similarly simple frontend inside `simulation/demos`
- No backend required for v1
- Use local component state only

### Suggested state model

Core state:

- `selectedRoute: 'public-help-hours' | 'protected-maintenance-panel'`
- `apiKey: string`
- `mode: 'idle' | 'public-success' | 'protected-missing-key' | 'protected-invalid-key' | 'protected-valid-key' | 'unsupported'`
- `eventLog: array`
- `allowedCount: number`
- `deniedCount: number`

Derived state:

- route type label
- key status label
- decision text
- proof card content
- result content

### Suggested decision logic

Pseudo-behavior:

1. If selected route is `public-help-hours`:
   - mode = `public-success`
   - append public success event

2. Else if selected route is `protected-maintenance-panel`:
   - if key is empty:
     - mode = `protected-missing-key`
     - append denied event
     - increment deniedCount
   - else if key equals `STAFF-ACCESS-DEMO-2026`:
     - mode = `protected-valid-key`
     - append allowed event
     - increment allowedCount
   - else:
     - mode = `protected-invalid-key`
     - append denied event
     - increment deniedCount

3. Else:
   - mode = `unsupported`

### Suggested proof data structure

Each event log entry may include:

- `timestampLabel`
- `route`
- `routeType`
- `keyStatus`
- `status`
- `message`

Example entries:

- `Public route | Allowed | no key required`
- `Protected route | Denied | missing key`
- `Protected route | Denied | invalid key`
- `Protected route | Allowed | valid staff key confirmed`

### Screen behavior recommendations

- When the public route is selected, visually de-emphasize the key field but keep it visible.
- When the protected route is selected, visually emphasize that the key is required.
- Keep the result panel persistent so the presenter can point to the outcome after each request.

### Suggested fake returned content

For `GET /public/help-hours`:

- `Help Desk Hours: 9:00 AM - 5:00 PM`
- `Visitor Support Counter: Ground Floor`

For successful `POST /staff/open-maintenance-panel`:

- `Maintenance Panel Status: Open`
- `Authorized Staff Session: Granted`

For denied protected action:

- `Maintenance Panel Status: Locked`

### Animation recommendations

Keep effects light and helpful:

- request button press feedback
- simple request arrow or flow step highlight
- badge fade or slide on outcome
- event log row highlight when a new event appears

Avoid flashy effects that distract from the story.

### Reset behavior

`Reset` should:

- clear the API key field
- return the result area to idle
- return route selection to default public route or preserve the current route
- optionally keep the event log for the current session
- preserve counters if session proof is useful during the expo

### Accessibility and expo practicality

- large route labels
- high contrast badges
- no scrolling required on a laptop screen
- understandable from a few feet away
- mouse-only usable

### Safety note

Do not call real APIs.
Do not use real credentials.
Do not connect to the main project.
Do not display any actual secret value from the platform.
This demo is educational simulation only.

---

## 20. Non-Goals

The first version should not try to:

- teach full API gateway internals
- manage multiple real users or roles
- connect to real secret storage
- use real authentication middleware
- simulate token expiry, rotation, or full IAM workflows
- act like a penetration testing tool

The goal is clarity, not completeness.

---

## 21. Acceptance Criteria

This spec is considered successfully implemented later only if:

1. A visitor can understand the difference between public and protected routes in under 60 seconds.
2. The public route succeeds without any API key.
3. The protected route fails with no key.
4. The protected route fails with an invalid key.
5. The protected route succeeds with the valid demo key.
6. The screen clearly shows why the request was allowed or denied.
7. It is obvious that the API key shown is simulated and safe for demo use.
8. Another agent can build the demo directly from this spec without guessing missing behavior.

---

## 22. Recommended File Target For Future Build

Suggested future structure only:

- `simulation/demos/api-key-protection/`
- `simulation/demos/api-key-protection/README.md`
- `simulation/demos/api-key-protection/src/...`

This spec should remain the source of truth for the demo behavior.
