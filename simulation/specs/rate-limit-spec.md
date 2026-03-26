# Rate Limiting Demo Spec

## Purpose

This document defines the full specification for the custom rate limiting simulation demo to be built inside `simulation` later.

The goal is to help layman expo visitors understand one simple idea:

If one person or bot sends too many requests too quickly, it can ruin fairness and availability for everyone else. Rate limiting stops that flood and keeps the system usable.

This spec is intentionally detailed so another agent can implement the demo without guessing.

---

## Demo Summary

- Demo name: Ticket Rush Fair Queue Demo
- Security concept: Rate limiting
- Story theme: Online concert ticket booking
- Audience: Non-technical expo visitors, judges, and faculty
- Core message: A platform must stop one user or bot from grabbing all attention at once, otherwise genuine users suffer
- Demo style: Highly visual side-by-side behavior with obvious request counts, queue pressure, and blocked proof

---

## Why This Story Works For Layman Visitors

Rate limiting can sound technical if explained as API request thresholds or gateway rules. Ticket booking is better because most visitors already understand these ideas:

- many people want the same thing at the same time
- one impatient or automated actor can spam the system
- fair queues matter
- a counter or gatekeeper should not let one person dominate the line

The visitor does not need to know anything about APIs to understand:

- normal customer = sends a few reasonable requests
- spammer/bot = sends too many requests too fast
- rate limiter = fairness guard at the entrance

This makes the security benefit emotionally obvious, not just technically correct.

---

## Story And Theme

### Narrative

The simulation represents a ticket booking portal for a popular concert. A genuine visitor tries to book a seat normally. A spammer or bot floods the booking endpoint with repeated requests to grab seats or overload the system.

The demo shows two states:

1. Rate limit OFF
2. Rate limit ON

When rate limit is OFF:

- the spammer floods the system
- the request lane becomes crowded
- normal users are slowed or starved
- too many ticket attempts are accepted

When rate limit is ON:

- the spammer is cut off after a small allowed burst
- later spam requests are blocked
- normal users still get served
- the system visibly stays fair and stable

### Tone

- simple
- bright
- visual
- fairness-focused instead of deeply technical

### Visual Metaphor

Use the idea of a ticket counter with a smart gate:

- without protection: one person keeps pushing to the front
- with protection: the gate says "slow down" and preserves fairness

---

## Learning Objective

After watching the demo, a visitor should be able to say:

"If too many requests come too fast, the system can get overwhelmed or unfair. Rate limiting blocks the flood so normal users can still use the service."

---

## Screen Layout

The demo should fit comfortably on a laptop screen and remain readable from standing distance.

### Recommended Layout Structure

Use a three-column layout on desktop:

1. Left panel: Control panel
2. Center panel: Live visual simulation area
3. Right panel: Proof and explanation panel

On smaller screens, stack in this order:

1. Control panel
2. Live simulation area
3. Proof panel

### Left Panel: Control Panel

This panel should contain:

- demo title: `Ticket Rush: Rate Limiting`
- short subtitle: `Keeps one bot from flooding the booking system`
- protection toggle:
  - `Rate Limit OFF`
  - `Rate Limit ON`
- action buttons:
  - `Send Normal Booking Request`
  - `Start Spam Flood`
  - `Replay Guided Demo`
  - `Reset`
- speed selector for spam flow:
  - `Slow`
  - `Medium`
  - `Fast`
- optional burst selector:
  - `10 requests`
  - `25 requests`
  - `50 requests`

### Center Panel: Live Simulation Area

This is the main storytelling area. It should be visually animated but simple.

It should contain:

- customer lane
  - a normal user card or avatar
  - small request bubbles moving toward the ticket server
- spammer lane
  - a bot/spammer card or avatar
  - many rapid request bubbles when flood starts
- ticket server box in the center/right of this panel
- gate badge attached to server:
  - shows `No Limit` when protection is OFF
  - shows `Rate Limiter Active` when protection is ON
- queue meter or pressure bar:
  - green = healthy
  - yellow = stressed
  - red = overloaded
- response badges floating back from server:
  - `Booked`
  - `Waiting`
  - `Blocked 429`
  - `Too Many Requests`

### Right Panel: Proof And Explanation

This panel should be split into two sections:

1. Live proof counters
2. Plain-language explanation

Live proof counters should show:

- total requests sent
- normal requests allowed
- spam requests allowed
- spam requests blocked
- current queue pressure
- current mode: `Protected` or `Unprotected`

Optional mini log table:

- time
- actor
- request id
- result
- reason

Plain-language explanation area should show short dynamic text:

- OFF state example:
  `Without rate limiting, the bot keeps sending booking attempts and the service becomes unfair.`
- ON state example:
  `With rate limiting, the system allows a small burst but blocks repeated flooding, keeping space for real visitors.`

---

## Main Visual Components

The future build should include these named UI pieces so the implementation is organized:

- `ModeToggle`
- `ActionControls`
- `ActorCard`
- `RequestStream`
- `ServerGate`
- `PressureMeter`
- `ProofCounters`
- `EventLog`
- `NarrationPanel`

These names are suggestions, but the demo must include the equivalent concepts.

---

## Demo States

The demo must support these explicit states.

### State 1: Idle

- no requests in motion
- counters at zero
- explanation text invites the presenter to start
- rate limit may be ON or OFF before actions begin

### State 2: Normal Usage

- a small number of requests travel from normal user to server
- all should succeed in both OFF and ON modes
- queue pressure remains low

### State 3: Spam Flood With Protection OFF

- many spam requests rapidly enter
- most or all are accepted
- queue pressure rises sharply
- normal lane experiences delay or lower success visibility
- proof panel shows very high allowed spam count and zero blocked count

### State 4: Spam Flood With Protection ON

- first few spam requests may be accepted
- later requests are blocked with `429 Too Many Requests`
- queue pressure remains controlled
- normal lane still gets successful bookings
- proof panel clearly separates allowed versus blocked spam requests

### State 5: Replay/Reset

- resets counts, log, animations, and messages
- can replay same scenario quickly for next visitor

---

## Normal Usage Flow

This flow shows that rate limiting does not punish normal behavior.

### Trigger

Presenter clicks `Send Normal Booking Request`.

### Visual Sequence

1. One to three customer request bubbles move toward the ticket server.
2. Server accepts each request.
3. Success labels return, such as `Booked` or `Seat Reserved`.
4. Queue pressure stays green and low.
5. Proof panel increases:
   - total requests sent
   - normal requests allowed

### Expected Outcome

- In OFF mode: success
- In ON mode: success

### Visitor Message

Rate limiting should feel invisible for regular people using the service normally.

---

## Spam/Flood Flow

This is the hero moment of the demo.

### Trigger

Presenter clicks `Start Spam Flood`.

### Visual Sequence With OFF

1. Spammer actor begins firing many requests quickly.
2. A stream of request bubbles floods the server.
3. The pressure meter climbs from green to yellow to red.
4. The server keeps accepting requests because no rate limit exists.
5. Normal user attempts appear delayed, visually crowded out, or marked as waiting.
6. Proof counters show:
   - spam allowed rising quickly
   - spam blocked staying at zero
   - queue pressure very high

### Visual Sequence With ON

1. Spammer actor begins firing many requests quickly.
2. First small burst is accepted.
3. The gate status changes to active blocking behavior.
4. Subsequent spam request bubbles hit the gate and bounce, fade, or turn red.
5. Red response badges appear: `Blocked 429`.
6. Normal customer requests still pass through and return success.
7. Proof counters show:
   - spam allowed rising only a little
   - spam blocked rising heavily
   - queue pressure staying moderate or low

### Visitor Message

Rate limiting is not about shutting everyone out. It is about slowing abusive traffic so the system remains fair for real users.

---

## Before/After Rate Limit Behavior

The demo must make the contrast unmistakable.

### Before: Rate Limit OFF

- system accepts nearly every request
- spammer can dominate the booking lane
- queue pressure becomes high
- normal user experience becomes visibly worse
- there is no block proof
- message should imply unfairness and instability

### After: Rate Limit ON

- system allows normal requests without issue
- system allows only a limited burst of spam requests
- extra spam is blocked clearly and repeatedly
- queue pressure stays under control
- normal user continues to get successful bookings
- message should imply fairness and resilience

### Required Side-By-Side Or Sequential Clarity

The demo does not need to show both states simultaneously, but it must make comparison easy.

Preferred approach:

- same screen
- same actions
- only one toggle changes behavior

This helps visitors understand that the security control, not the scenario, causes the improvement.

---

## Simple Rule Model For Future Implementation

The future build should not depend on a real backend to demonstrate the concept. Use deterministic simulation rules.

### Recommended Simulated Rule

- rate limit window: 5 requests
- time window: 3 seconds
- actor-specific tracking: mainly for spammer actor
- response after threshold: `429 Too Many Requests`

### Normal User Behavior

- sends 1 request per action
- always below threshold

### Spammer Behavior

- sends burst of 10, 25, or 50 requests
- interval determined by selected speed
- easily crosses threshold when protection is ON

### Queue Pressure Logic

Suggested simplified visualization rule:

- 0 to 4 active requests = green
- 5 to 9 active requests = yellow
- 10+ active requests = red

### OFF Mode Rule

- accept all requests
- do not block
- queue pressure rises based on request volume

### ON Mode Rule

- allow first `N` requests inside window
- block remaining requests inside same window
- show blocked status immediately

---

## What Is Fake Vs What Connects To The Real Platform

The demo should be mostly simulated to keep it reliable and fast during an expo.

### Fake / Simulated

These should be simulated inside the custom demo:

- ticket booking interface
- customer and spammer actors
- request animations
- queue pressure meter
- request counter logic
- block decisions for the visual demo
- response messages like `Booked` and `Blocked 429`
- event log shown in the custom page

### Optional Real Connection

The demo may optionally mirror the idea of real platform protection, but it should not depend on live project behavior to function.

Possible light connection in a future version:

- a prepared screenshot or mirrored metric style inspired by the main project
- a later link-out to actual gateway/WAF proof in a separate real-platform demo

### Must Not Be Required

The following must not be required for the rate limiting simulation to run:

- live requests into the main project
- edits to main project code
- dependency on a running production-like backend
- dependency on network access

### Presenter Truthfulness Note

The presenter should say clearly:

"This page is a simplified simulation built for explanation. The protection concept is real, but this ticket website itself is a demo."

That keeps the presentation honest and avoids confusion.

---

## Proof That Must Appear On Screen

The proof must be visible enough that a visitor can understand it without listening to every word.

### Required Proof Elements

The screen must visibly show all of these:

- count of total requests sent
- count of spam requests blocked
- count of spam requests allowed
- count of normal requests allowed
- visible `429 Too Many Requests` responses in protected mode
- visible difference in queue pressure between OFF and ON

### Required Proof Moment

During the spam flow with protection ON, at least one obvious cluster of blocked events must appear.

Examples:

- multiple red `429` labels
- event log rows marked `BLOCKED`
- blocked counter increasing rapidly

### Event Log Fields

The proof log should show concise rows like:

| Time | Actor | Request | Result | Reason |
|---|---|---|---|---|
| 12:01:05 | Customer | book-seat-001 | ALLOWED | Normal traffic |
| 12:01:06 | Bot | book-seat-014 | BLOCKED | Rate limit exceeded |

### End-State Summary Card

After a spam run completes, show a short summary card:

- OFF mode example:
  `50 spam requests accepted, queue overloaded, normal users delayed`
- ON mode example:
  `5 spam requests allowed, 45 blocked, booking stayed available for normal users`

This summary is important for quick understanding.

---

## Presenter Script

This should work as a 30 to 60 second expo explanation.

### Short Script

"This demo shows rate limiting using a concert ticket website. A normal customer sends just a few booking requests, and everything works fine. But if a bot starts flooding the booking system with dozens of rapid requests, the platform can become unfair or overloaded.

Right now, with rate limiting off, the flood keeps getting through, the queue pressure rises, and real users get affected. Now I switch protection on. The first few requests may pass, but after that the system says `Too Many Requests` and blocks the flood. You can see the blocked counter rising here, while the normal customer still succeeds. So rate limiting acts like a fairness guard at the gate."

### Ultra-Short Version

"Without rate limiting, one bot can flood the booking line. With rate limiting, extra requests are blocked, and normal users still get service."

### Key Words The Presenter Should Prefer

- fair queue
- flood
- slow down abusive traffic
- protect genuine users
- too many requests
- keeps the system available

### Terms The Presenter Should Avoid Unless Asked

- token bucket
- sliding window
- reverse proxy internals
- gateway implementation details

---

## Interaction Script For The Presenter

This is the exact recommended click flow.

### Demo Run 1: Normal Behavior

1. Ensure mode is `Rate Limit ON`
2. Click `Send Normal Booking Request`
3. Point to successful booking and low pressure
4. Say that normal users are unaffected

### Demo Run 2: Flood Without Protection

1. Switch to `Rate Limit OFF`
2. Click `Start Spam Flood`
3. Point to rising pressure and accepted spam requests
4. Mention unfairness for real users

### Demo Run 3: Flood With Protection

1. Click `Reset`
2. Switch to `Rate Limit ON`
3. Click `Start Spam Flood`
4. Point to red blocked events and `429` labels
5. Point to normal user still succeeding
6. End on the summary card

### Ideal Presentation Length

- quick version: 35 to 45 seconds
- fuller version: 60 to 75 seconds

---

## Functional Requirements For Future Build

The implementation must satisfy these requirements.

### Required Functional Behavior

- user can toggle protection ON/OFF before each run
- user can trigger a normal request
- user can trigger a spam flood
- user can reset the simulation instantly
- spam flood must generate multiple request events over time, not all at once in a static jump
- blocked requests must appear only when protection is ON and threshold is crossed
- normal requests must still succeed in protected mode
- counters and log must update live
- final summary must be shown after each spam scenario

### Required UX Behavior

- results must be understandable without scrolling
- status colors must be consistent:
  - green = allowed / healthy
  - red = blocked / danger
  - yellow = stressed / waiting
- text must be understandable by laymen in a few seconds
- animations should support comprehension, not distract

### Required Reliability Behavior

- demo must run without network access
- demo must be deterministic enough for repeatable expo use
- reset must always return to clean state

---

## Non-Functional Requirements

- build should be lightweight and fast to start
- no dependency on the main project runtime
- should work smoothly on a standard laptop browser
- should be readable from a short distance while standing
- should be presentable in noisy expo conditions with low explanation overhead

---

## Content And Copy Requirements

### Suggested Headline

`Rate Limiting Keeps Ticket Booking Fair`

### Suggested Subheadline

`Stops one bot from flooding the system so real visitors can still book normally`

### Suggested Helper Text

`Try a normal booking first, then start a spam flood and compare OFF vs ON.`

### Suggested Protected Message

`Rate limiter active: excessive requests are being blocked`

### Suggested Unprotected Message

`No request limit: repeated traffic can overwhelm fairness`

---

## Accessibility And Clarity Notes

- avoid relying only on color; pair color with words like `ALLOWED`, `BLOCKED`, `WAITING`
- use large counters and high contrast
- keep animations slow enough to follow
- do not bury the proof log below the fold
- provide a visible reset button for repeated presentations

---

## Edge Cases To Cover In Future Build

- switching protection mode mid-animation
  - recommended: disable toggle during active flood, or apply change only after reset
- clicking spam button multiple times rapidly
  - recommended: ignore while a flood is already running
- resetting during active flood
  - recommended: cancel all pending simulated requests and return to idle
- sending a normal request during spam flow
  - recommended: allow it so the presenter can show that normal traffic still succeeds in protected mode

---

## Implementation Notes For The Future Build

This section is for the next agent who will code the demo.

### Recommended Build Style

- build as a self-contained frontend simulation page inside `simulation/demos`
- no backend required
- use local state and timers to simulate request flow

### Suggested Internal Data Model

Use event objects such as:

```text
{
  id: string,
  actor: "customer" | "bot",
  type: "booking",
  status: "pending" | "allowed" | "blocked" | "waiting",
  timestamp: number,
  reason?: string
}
```

Use aggregate state such as:

```text
{
  mode: "off" | "on",
  totalRequests: number,
  normalAllowed: number,
  spamAllowed: number,
  spamBlocked: number,
  pressure: "low" | "medium" | "high",
  floodRunning: boolean
}
```

### Suggested Simulation Mechanics

- normal request:
  - spawn one request event
  - resolve as allowed after short delay
- spam flood:
  - generate series of events via timer
  - evaluate each event against mode and threshold
  - append to live log
  - update counters each time

### Suggested Protection Logic

Keep the logic simple and visible:

- count bot requests within recent simulated window
- if count exceeds threshold and mode is ON:
  - mark event blocked
  - show reason `Rate limit exceeded`
- otherwise:
  - allow request

Exact algorithm need not match production behavior. Clarity matters more than realism.

### Suggested Animation Logic

- pending requests move from actor lane to server
- allowed requests continue through server and return success badge
- blocked requests stop at gate and flash red
- pressure meter updates every few events rather than every animation frame

### Suggested End Of Run Logic

After final spam event:

- stop timers
- compute summary text
- display end-state card prominently

### Suggested File Output

The future build agent should likely create:

- one demo page/component
- one small reusable counter component
- one event log component
- one simulation state utility file if needed

File names may vary, but the demo should remain fully contained in `simulation`.

---

## Acceptance Criteria

This spec should be considered successfully implemented later only if all of these are true:

- a visitor can understand the story without technical background
- normal usage succeeds in both modes
- flood behavior visibly harms fairness when OFF
- flood behavior is visibly blocked when ON
- `429 Too Many Requests` proof appears on screen
- counters clearly distinguish allowed versus blocked spam
- reset enables quick replay for multiple visitors
- the page does not depend on the main project runtime

---

## Final One-Line Message Of The Demo

Rate limiting is the system's way of saying: "You can use the service, but you cannot flood the line and ruin it for everyone else."
