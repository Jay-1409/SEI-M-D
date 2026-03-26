# XSS Simulation Spec

## 1. Purpose

This spec defines a visitor-friendly XSS simulation for the expo.

The goal is to help a layman understand:
- what a normal comment flow looks like,
- how harmful code can be hidden inside a public comment,
- what risk that creates,
- how gateway protection stops it,
- and what visible proof confirms the protection worked.

This is a spec only. It does not build the demo.

---

## 2. Demo Summary

### Demo name
`Feedback Wall XSS Demo`

### Demo type
Custom simulation inside `simulation`

### Security concept
Cross-Site Scripting (XSS)

### Short layman explanation
"A public comment box should accept normal text, not hidden code. This demo shows how our protection blocks a dangerous comment before it can affect other visitors."

### Intended audience
- non-technical expo visitors
- faculty members
- judges who want a fast, visual explanation

---

## 3. Story And Theme

### Theme
A public event feedback wall for a college tech fest.

### Story
Visitors can leave feedback after attending a campus event. Most people write harmless comments like "Great event" or "Loved the project display." But an attacker tries to post a comment containing hidden script code. If the system accepts it, that code can run in another visitor's browser and manipulate the page or steal session-like data.

### Why this theme works
- A feedback wall is familiar to almost everyone.
- A comment box is visually simple.
- The difference between "normal text" and "hidden harmful code" is easy to show side by side.
- The visitor does not need to know JavaScript or browser internals to understand the risk.

### Visual tone
- clean and friendly, like a school event page
- bright and safe-looking in normal mode
- obvious warning colors only when attack behavior is demonstrated

---

## 4. Why Layman Visitors Will Understand It

This simulation should be understandable because:

1. The input is a normal comment box that anyone has used before.
2. The safe action is obvious: type a message and post it.
3. The unsafe action is also obvious: instead of a normal message, someone pastes strange code.
4. The consequence is shown visually on screen, not explained only with technical words.
5. The before/after protection toggle creates a simple story:
   - before protection: dangerous content gets through
   - after protection: dangerous content is blocked
6. The proof panel confirms that the system noticed the attack and recorded it.

### Words to prefer in the UI and presentation
- "dangerous comment"
- "hidden script"
- "attack blocked"
- "safe comment posted"
- "security proof"

### Words to avoid in the main visitor-facing area
- DOM-based XSS
- reflected vs stored XSS
- payload signature engine
- input sanitization middleware

Those technical details can appear only in implementation notes or faculty discussion, not in the main visitor flow.

---

## 5. Simulation Goal

By the end of the demo, the visitor should understand this exact message:

"Normal comments should appear on a public page, but hidden code should not. Our secure gateway can detect a dangerous script attempt, block it, and show proof that it was stopped."

---

## 6. Screen Layout

The simulation should fit on one desktop/laptop screen without scrolling during the main demo.

### Recommended layout

Use a 3-column layout:

1. Left column: Comment composer
2. Center column: Public feedback wall
3. Right column: Security/proof panel

### Left column: Comment composer

Contents:
- Demo title: `College Tech Fest Feedback Wall`
- Small helper text:
  `Visitors can leave public feedback here.`
- Protection toggle:
  - `Protection OFF`
  - `Protection ON`
- Optional sublabel:
  `Gateway XSS protection`
- Name input
  - default example: `Aarav`
- Comment textarea
- Two quick-fill buttons:
  - `Use Normal Comment`
  - `Use Attack Payload`
- Main action button:
  - `Post Comment`
- Reset button:
  - `Reset Demo`

### Center column: Public feedback wall

Contents:
- Section title: `Live Feedback Wall`
- 2 or 3 preloaded safe comments
- New comments appear at the top
- Each comment card shows:
  - avatar circle or initials
  - display name
  - posted time like `Just now`
  - rendered comment content

### Right column: Security/proof panel

Contents:
- Section title: `Security Proof`
- Status badge:
  - `Safe Activity`
  - `Warning`
  - `Attack Blocked`
- Mini explanation text based on current action
- Event proof card
- Block counter
- Last action summary
- Optional simulated gateway request view

### Optional top header

At the top of the page, include a simple step indicator:
- `1. Write comment`
- `2. Submit`
- `3. See what appears`
- `4. Check security proof`

This helps first-time visitors follow the flow quickly.

---

## 7. Exact Initial Screen State

When the demo loads:

- Protection toggle defaults to `OFF`
- Comment wall shows 3 safe comments such as:
  - `Riya: Loved the robotics booth.`
  - `Kabir: The security project explanation was very clear.`
  - `Neha: Great event management and good demos.`
- Name input default: `Visitor 1`
- Comment box is empty
- Block count is `0`
- Security status is `Idle`
- No warning modal is open

### Optional helper line under the toggle
When protection is OFF:
`Unsafe mode: the page is not filtering dangerous script-style comments.`

When protection is ON:
`Protected mode: dangerous script-style comments will be blocked at the gateway.`

---

## 8. Exact Normal Comment / Feedback Flow

This flow must feel simple and successful.

### Normal comment example
Name: `Aarav`

Comment:
`Great event. The project demos were easy to understand.`

### Step-by-step flow

1. Presenter or visitor clicks `Use Normal Comment`.
2. The name field becomes `Aarav`.
3. The comment box fills with:
   `Great event. The project demos were easy to understand.`
4. User clicks `Post Comment`.
5. UI shows a short sending state for realism, around 300-700 ms.
6. Comment appears on the feedback wall as normal text.
7. Security panel updates to a safe success state.

### Exact expected on-screen result

Feedback wall:
- A new comment card appears at the top.
- The text renders exactly as readable text.

Security panel:
- Status badge: `Safe Activity`
- Message:
  `Normal text comment accepted. No attack pattern detected.`
- Last action:
  `Comment posted successfully`
- Block counter remains unchanged

### Important rule
The normal comment must work the same way whether protection is OFF or ON.

That helps visitors understand the protection is not breaking ordinary usage.

---

## 9. Exact Malicious Payload Flow

This flow must be dramatic but still safe and easy to follow.

### Attack story
An attacker tries to submit a public comment that contains script code instead of plain text.

### Recommended payload shown to the user
Use a simple, recognizable payload:

```html
<script>document.getElementById('demo-banner').innerText='Page Manipulated';</script>
```

### Why this payload is recommended
- It is clearly "code", even for non-technical viewers.
- It demonstrates page manipulation instead of using a more confusing payload.
- It avoids implying real data theft is happening in the demo.
- It is safer and easier to simulate visually.

### Optional alternate demo payload

```html
<img src="x" onerror="document.getElementById('demo-banner').innerText='Hidden code executed';">
```

Use only one payload in the actual build. Do not mix multiple attack types in the visitor flow.

---

## 10. Before Protection Behavior

This is the `Protection OFF` behavior.

### Goal
Show why accepting a dangerous comment is a problem.

### Exact flow

1. Presenter clicks `Use Attack Payload`.
2. Name becomes `Attacker`.
3. Comment box fills with the chosen payload.
4. Protection toggle is visibly `OFF`.
5. User clicks `Post Comment`.
6. The comment is accepted by the simulation.
7. The public feedback wall shows that something unsafe has been rendered.
8. A visible on-screen effect demonstrates the danger.

### Recommended unsafe visual effect

Do not simulate real credential theft.

Instead, simulate one clear and harmless consequence:
- a banner at the top of the feedback wall changes to:
  `Warning: page content was modified by a dangerous comment`

Optional secondary effect:
- one fake session badge changes from:
  `Visitor session safe`
  to
  `Visitor session at risk`

### Exact expected on-screen result in unsafe mode

Feedback wall:
- The malicious comment appears as an accepted post or appears as a visibly unsafe rendered item.
- The banner changes immediately after the post.

Security panel:
- Status badge: `Warning`
- Message:
  `Dangerous script-style content was accepted because protection is OFF.`
- Last action:
  `Unsafe comment reached the page`
- Block counter stays at `0`
- Event proof:
  `No gateway block occurred`

### Visitor takeaway
"If hidden code is treated like a normal comment, it can change the page for other users."

---

## 11. After Protection Behavior

This is the `Protection ON` behavior.

### Goal
Show the same payload being blocked before it reaches the page.

### Exact flow

1. Presenter switches toggle to `Protection ON`.
2. Helper text changes to protected wording.
3. Presenter clicks `Use Attack Payload` again.
4. The same payload appears in the input.
5. User clicks `Post Comment`.
6. The request is checked by the simulated secure gateway.
7. The payload is rejected.
8. The dangerous comment does not appear on the wall.
9. The warning banner does not change.
10. The proof panel shows the block event clearly.

### Exact expected on-screen result in protected mode

Feedback wall:
- No malicious comment is added.
- Existing safe comments remain unchanged.
- Any unsafe-mode warning banner from a previous run should either:
  - disappear after reset, or
  - remain only if the user has not reset the demo yet

Security panel:
- Status badge: `Attack Blocked`
- Message:
  `Dangerous script content was detected and blocked before reaching the page.`
- Last action:
  `XSS attempt blocked`
- Block counter increases by 1
- Proof card displays:
  - Attack type: `XSS`
  - Route: `/feedback/submit`
  - Decision: `Blocked`
  - Reason: `Script-like content detected in comment field`

### Submission error shown near the form

Display a friendly error toast or inline message:

`Comment rejected: dangerous script-like content is not allowed.`

This should be clear and non-technical.

### Visitor takeaway
"The same harmful comment that was risky before is now stopped before it can affect anyone."

---

## 12. Before/After Comparison Summary

This summary should be visually obvious in the final build.

| State | Normal comment | Malicious comment | What visitor sees |
|---|---|---|---|
| Protection OFF | Accepted | Accepted | page warning/manipulation effect appears |
| Protection ON | Accepted | Blocked | safe page remains unchanged and proof appears |

### Key teaching point
Protection should stop harmful input without stopping ordinary users from posting normal comments.

---

## 13. What Is Fake Vs What Connects To The Real Platform

This must stay very clear for future implementation.

### Fully fake / simulated parts
- feedback wall UI
- comment form
- sample names and sample comments
- unsafe page-manipulation effect
- local state that adds or blocks comments
- fake route label such as `/feedback/submit`
- simulated request/response timing
- local attack counters if not connected

### Preferred real-platform connection
If practical in a later build, connect only the proof area to real platform concepts, not to a real unsafe page.

Possible real connections:
- visual style or naming that matches the main platform
- WAF log terminology aligned with the platform
- a real WAF dashboard shown separately after the simulation
- a real blocked-event example from the platform, if available and safe

### What should not connect to the real platform
- no real unsafe comment should be stored in the main project
- no real XSS should execute against the main project
- no direct modification to the main project UI
- no dependence on the main project for the core simulation behavior

### Rule for future implementers
The XSS demo must work entirely inside `simulation` even if the real platform is unavailable.

---

## 14. What Proof Should Appear On Screen

Every run of the demo should end with visible proof.

### Minimum required proof elements

1. Protection state indicator
   - `OFF` or `ON`

2. Last action status
   - `Comment posted successfully`
   - `Unsafe comment reached the page`
   - `XSS attempt blocked`

3. Block counter
   - example: `XSS blocks: 1`

4. Event proof card
   - Attack type: `XSS`
   - Target: `/feedback/submit`
   - Field: `comment`
   - Decision: `Blocked`
   - Time: `Just now`

5. Visual wall result
   - unsafe mode: banner or page state visibly changed
   - protected mode: wall stays normal

### Nice-to-have proof elements
- short request preview with suspicious input highlighted
- green check icon for safe comment
- red blocked icon for malicious attempt
- event timeline showing the last 3 actions

### Proof text examples

Safe post:
`Safe comment posted. No harmful script pattern found.`

Unsafe acceptance:
`Dangerous content reached the page because protection is OFF.`

Blocked attempt:
`XSS attempt blocked before rendering.`

---

## 15. Presenter Script

This should be usable as a 30-60 second explanation.

### Short version

"This page is a simple public feedback wall. A normal visitor can post a comment like 'Great event,' and it appears normally. But an attacker can also try to hide script code inside a comment. With protection off, that dangerous comment is accepted and the page gets modified, which shows the risk. Now I turn protection on and submit the exact same attack again. This time it is blocked before reaching the page, and the proof panel shows that the gateway detected an XSS attempt."

### Slightly slower version

"Here we are simulating a public feedback page, which is something any website might have. Normal users should be able to post plain text comments safely. First I post a normal comment, and it appears on the wall as expected. Now instead of text, I paste a hidden script payload. With protection off, the system accepts it, and you can see the page warning change, which represents the danger of XSS. Now I switch protection on and retry the same payload. The wall stays safe, the comment is rejected, and the security panel shows a blocked XSS event. So the idea is simple: normal comments pass, dangerous code does not."

### One-line close
`Normal feedback is allowed, but hidden code is blocked.`

---

## 16. Exact Demo Sequence For Presenters

This is the recommended live order.

1. Show the feedback wall and say it is a public comment page.
2. Post one normal comment.
3. Point out that normal use still works.
4. Click `Use Attack Payload`.
5. Keep protection `OFF`.
6. Submit the malicious comment.
7. Point to the changed warning/banner as the visible danger.
8. Click `Reset Demo`.
9. Turn protection `ON`.
10. Use the same attack payload again.
11. Submit.
12. Point out that the wall did not change and the attack was blocked.
13. End on the proof panel.

### Timing target
- fast version: 35-45 seconds
- standard version: 50-70 seconds

---

## 17. Detailed UI Copy Recommendations

These are suggested final strings for the future build.

### Titles
- `College Tech Fest Feedback Wall`
- `Live Feedback Wall`
- `Security Proof`

### Helper copy
- `Leave a public comment about the event.`
- `Normal comments should appear as plain text.`
- `Dangerous script-style comments should be blocked.`

### Buttons
- `Use Normal Comment`
- `Use Attack Payload`
- `Post Comment`
- `Reset Demo`

### Toggle labels
- `Protection OFF`
- `Protection ON`
- `Gateway XSS Protection`

### Success/error states
- `Comment posted successfully`
- `Comment rejected: dangerous script-like content is not allowed.`
- `Dangerous content reached the page`
- `XSS attempt blocked`

### Banner text for unsafe demonstration
- `Warning: page content was modified by a dangerous comment`

---

## 18. Interaction Rules

These rules should guide the future implementation.

1. The attack payload should never trigger a real dangerous browser action outside the controlled demo effect.
2. The demo should use a safe simulated effect, such as changing banner text.
3. The same payload must produce two different outcomes depending on the protection toggle.
4. Reset should return:
   - original safe comments
   - block counter to zero, or to the default starting value chosen by implementation
   - banner to normal
   - status to idle
5. Normal comments must stay readable and friendly.
6. The UI should never become confusing, scary, or too technical.

---

## 19. Implementation Notes For The Future Build

These notes are for the next agent that will build the demo.

### Build style
- single-page simulation
- no dependency on main project runtime
- should run locally from inside `simulation`
- prioritize clarity over realism

### Suggested technical approach
- use local state for:
  - protection toggle
  - comment list
  - form values
  - status message
  - proof card contents
  - block count
  - unsafe banner state

### Recommended simulation logic

Create a simple helper that checks the submitted comment text for obvious XSS-like patterns, such as:
- `<script`
- `onerror=`
- `onload=`
- `javascript:`

When protection is OFF:
- accept both safe text and malicious payload
- if malicious pattern is found, trigger the harmless page-manipulation effect

When protection is ON:
- accept safe text
- reject suspicious payload
- update proof panel with a blocked event

### Important safety note
The build should not use `dangerouslySetInnerHTML` or any equivalent approach that could create a real unsafe condition during development unless it is tightly sandboxed and still harmless. Prefer a fully simulated unsafe effect instead of real script execution.

### Suggested data model

Example comment object:

```json
{
  "id": "c1",
  "author": "Aarav",
  "text": "Great event. The project demos were easy to understand.",
  "timeLabel": "Just now",
  "kind": "safe"
}
```

Example proof event object:

```json
{
  "id": "evt-1",
  "attackType": "XSS",
  "route": "/feedback/submit",
  "field": "comment",
  "decision": "Blocked",
  "reason": "Script-like content detected in comment field",
  "timeLabel": "Just now"
}
```

### Suggested seeded comments
- `Riya: Loved the robotics booth.`
- `Kabir: The security project explanation was very clear.`
- `Neha: Great event management and good demos.`

### Suggested preset payload button behavior

`Use Normal Comment`
- fills name and safe message

`Use Attack Payload`
- fills name `Attacker`
- fills the chosen demo payload

### Suggested visual states
- neutral gray for idle
- green for safe result
- amber/red for warning or blocked result

### Responsive note
Desktop/laptop presentation is the priority, but the layout should stack cleanly on smaller screens if needed.

### Accessibility note
- keep text large enough to read from a small audience distance
- ensure status colors also have text labels
- avoid relying only on red/green color differences

---

## 20. Acceptance Criteria For This Spec

The future implementation should satisfy this spec if:

1. A visitor can post a normal comment and see it appear clearly.
2. A malicious script-style comment can be demonstrated in unsafe mode.
3. Unsafe mode causes a harmless but visible page-manipulation effect.
4. Protected mode blocks the same payload.
5. The dangerous comment does not appear in protected mode.
6. A proof panel clearly shows that an XSS attempt was blocked.
7. The full flow is understandable without technical background.
8. The demo works entirely from inside `simulation`.

---

## 21. Final Build Intent

The finished XSS demo should feel like a simple public comment page that tells a clear story in under one minute:

- normal people leave normal comments,
- attackers try to hide code in public input,
- unsafe systems may accept it,
- the secure gateway blocks it,
- and the visitor can see proof immediately.
