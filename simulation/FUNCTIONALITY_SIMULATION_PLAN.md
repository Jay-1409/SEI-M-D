# Secure Microservice Deployer

## Simulation Planning Document

This document is only for planning expo demos and simulations.

Rules followed while preparing this file:
- No main project code is changed.
- All planning is kept inside the `simulation` folder.
- The goal is not to impress technical judges only, but to help a layman quickly understand:
  - what problem exists,
  - what danger it creates,
  - how this platform helps,
  - what the result looks like.

---

## 1. What The Software Provides

Based on the current project, the platform provides these main capabilities:

1. Docker image upload and identification
2. Secure deployment of a service into Kubernetes
3. Exposure of deployed services only through a central gateway
4. Service lifecycle control
5. Image vulnerability scanning with Trivy
6. Running-service web scanning with Nikto
7. SQL injection protection at the gateway
8. XSS protection at the gateway
9. Dangerous-header filtering at the gateway
10. WAF event logging and statistics
11. API rate limiting
12. API key protection for selected routes
13. Automatic discovery of OpenAPI / Swagger documentation
14. A dashboard for managing and monitoring services

These are not all equally good for an expo. Some are very visual and easy to understand; some are technically strong but need better storytelling.

---

## 2. Best Expo Strategy

For a college expo with layman visitors, the best order is:

1. Start with a problem that feels real in daily life.
2. Show a small app or service that looks normal.
3. Show how it can be abused or attacked.
4. Turn on one protection from your platform.
5. Show the same attack fail.
6. End with a clear dashboard result or log so the visitor sees proof.

This means the best simulations should be based on:
- login forms,
- comment / feedback boxes,
- public APIs,
- “too many requests” abuse,
- “private data should not be directly exposed” stories,
- simple visual dashboards.

---

## 3. Recommended Simulation List

Below is the recommended mapping of each functionality to a demo or simulation.

---

## 3.1 Secure Deployment Through Central Gateway

### Functionality
- Deploy user services as internal Kubernetes services.
- Expose them through one gateway instead of exposing each service directly.

### Why It Matters To Laymen
Most people understand a “security checkpoint” or “main gate” better than “reverse proxy” or “ClusterIP”.

### Recommended Simulation
`Apartment Building Security Demo`

### Simulation Idea
- Present each microservice as a flat/apartment inside a building.
- The gateway is the security guard at the building entrance.
- Visitors cannot directly enter any flat from the street.
- They must first go through the guard.

### Practical Demo Version
- Use a fake “Food Delivery Service” or “Online Clinic Service”.
- Show a list of services in the platform dashboard.
- Explain that these services are inside the cluster and are not directly public.
- Show that people access only the gateway URL, not internal service URLs.

### What To Show On Screen
- Dashboard with deployed services
- Public gateway link
- Architecture picture simplified for expo use

### Visitor Message
"Instead of leaving every door open to the internet, we keep all services inside and allow access only through one monitored entrance."

### Why This Is Good
- Very easy to explain
- Gives overall context before security features
- Helps visitors understand why the project exists at all

### Priority
- High

---

## 3.2 Docker Image Upload And Port Detection

### Functionality
- Upload a Docker image tar file
- Load it
- Detect exposed ports and suggest deployment info

### Why It Matters To Laymen
This shows that the platform helps operators deploy apps correctly and not manually guess technical settings.

### Recommended Simulation
`Smart Parcel Check-In Demo`

### Simulation Idea
- Treat a Docker image like a parcel arriving at a secure building.
- The platform checks what is inside and how it should be handled before letting it enter.

### Practical Demo Version
- Have two prepared images:
  - one correct and clean-looking,
  - one intentionally suspicious or outdated-looking.
- Upload one image and show that the platform reads its details and suggests the port.

### What To Show
- Upload area
- Detected image name
- Detected port
- Suggested port

### Visitor Message
"This platform does not just blindly deploy a file. It first checks what kind of service it is."

### Why This Is Good
- Simple first interaction
- Good warm-up before deeper security demos

### Priority
- Medium

---

## 3.3 Trivy Image Vulnerability Scan

### Functionality
- Scan the container image for known package and dependency vulnerabilities

### Why It Matters To Laymen
People understand the idea of “checking a product before using it”.

### Recommended Simulation
`Medicine Strip Before Use Demo`

### Simulation Idea
- Compare container images to sealed medicine packets or packaged goods.
- Even before opening or using them, you should check if they are expired, unsafe, or known to be risky.

### Practical Demo Version
- Use two sample services:
  - `Safe Shop API`
  - `Old Vulnerable Shop API`
- Run Trivy on both.
- Show a clean result for one and a findings list for the other.

### Stronger Storytelling Option
- Label one image as “updated 2026 build”
- Label another as “old copied image from unknown source”
- Then show different scan results

### What To Show
- Trigger Trivy scan button
- Progress indicator
- Findings summary
- Critical and high counts

### Visitor Message
"We can inspect the software package before deploying it, so risky software can be identified early."

### Best Visual Angle
- Use color-coded severity counts
- Red for critical, orange for high, green for clean

### Why This Is Good
- Strong cybersecurity relevance
- Easy to explain without code
- Good visual output already exists in the project

### Priority
- High

---

## 3.4 Nikto Scan For Deployed Web Service

### Functionality
- Scan a running deployed service for web vulnerabilities and risky behavior

### Why It Matters To Laymen
People understand “checking a live building after it is opened” better than only checking a package before installation.

### Recommended Simulation
`House Inspection After Move-In Demo`

### Simulation Idea
- Trivy is like inspecting the packaged material before installation.
- Nikto is like visiting the actual house after it is occupied and checking weak doors, unsafe windows, and poor construction.

### Practical Demo Version
- Deploy a vulnerable demo service
- Run Nikto scan from the service details page
- Show the list of findings

### What To Show
- Run Scan button
- Findings count
- Vulnerability cards
- Target information
- Completed time

### Visitor Message
"Even if an app is deployed successfully, it can still behave insecurely when live. We test the live service too."

### Why This Is Good
- Complements Trivy nicely
- Gives “before deployment” and “after deployment” security coverage

### Priority
- High

---

## 3.5 SQL Injection Protection

### Functionality
- Gateway can detect and block SQL injection patterns in request paths, parameters, headers, and bodies

### Why It Matters To Laymen
This is one of the strongest and most relatable attack demos if explained simply.

### Recommended Simulation
`Fake Login / Student Portal Demo`

### Simulation Idea
- Create a simple fake login page in the simulation workspace.
- The login page talks to a fake backend or scripted API response.
- Show that a malicious input like `' OR 1=1 --` can act like a bypass attempt.
- Then show the same request being blocked when WAF protection is enabled.

### Best Storyline
- Name the app something familiar:
  - Student results portal
  - School library login
  - Employee payroll portal
- Explain:
  - normal user enters username and password
  - attacker enters crafted text instead of a real password
  - system should treat it as an attack, not a normal request

### Recommended Visitor Flow
1. Show normal login works for a correct user
2. Show attack payload attempt
3. With SQLi protection OFF, show “this would be dangerous”
4. Turn SQLi protection ON in the platform
5. Repeat attack
6. Show request blocked and logged in WAF events

### What To Show
- Fake login form
- Toggle for SQLi protection
- Block message
- WAF stats increasing
- WAF event log entry with attack type

### Visitor Message
"This stops attackers from sending specially crafted text to trick a system into giving unauthorized access."

### Why This Is Excellent
- Very understandable
- Dramatic before/after effect
- Great for expo crowds
- Lets you use a realistic but safe simulation

### Priority
- Very High

---

## 3.6 XSS Protection

### Functionality
- Gateway can detect and block cross-site scripting payloads

### Why It Matters To Laymen
People may not know “XSS”, but they immediately understand “someone posts harmful code in a comment box”.

### Recommended Simulation
`Public Comments / Feedback Wall Demo`

### Simulation Idea
- Create a fake comments or feedback page.
- A normal user posts: "Great service".
- An attacker tries to post a script payload.
- Then show how the firewall blocks it.

### Best Storyline
- Use a public product review page or school event feedback board
- Explain:
  - normal users write comments
  - attackers insert hidden script code
  - if it runs, it can steal sessions or manipulate the page

### Recommended Visitor Flow
1. Show normal comment submission
2. Show harmful comment payload attempt
3. Explain what could happen if it were accepted
4. Enable XSS protection
5. Retry the same payload
6. Show block event and log entry

### What To Show
- Comment form
- Rendered safe comments
- Fake “bad payload” example
- WAF log with XSS label
- XSS block count in stats

### Visitor Message
"This stops websites from accepting dangerous script content disguised as normal text."

### Why This Is Excellent
- Very visual
- Less technical than SQLi
- Strong crowd appeal

### Priority
- Very High

---

## 3.7 Dangerous Header Filtering

### Functionality
- Gateway strips or blocks dangerous inbound headers and can enforce safer content-type behavior

### Why It Matters To Laymen
This is harder to explain than SQLi/XSS, so the story must be simplified.

### Recommended Simulation
`Fake Delivery ID / Fake Entry Pass Demo`

### Simulation Idea
- Compare headers to hidden badges or special stickers on a parcel.
- Attackers may attach fake internal labels to trick the system.
- The gateway removes untrusted special labels before forwarding.

### Practical Demo Version
- Build a very simple “document upload” or “admin request” simulation.
- Show that a request can carry fake hidden metadata.
- When header protection is ON, the suspicious metadata is ignored or blocked.

### Better Alternative
Use a visual inspector panel:
- left side: incoming request
- middle: gateway security checkpoint
- right side: forwarded safe request

### Visitor Message
"Not all danger is in what you type on screen. Some attacks hide in extra technical request data. Our gateway filters those too."

### Why This Is Good
- Shows deeper security maturity
- Makes the gateway look intelligent

### Limitation
- Harder for non-technical visitors to grasp instantly

### Priority
- Medium

---

## 3.8 WAF Event Logging And Statistics

### Functionality
- Gateway stores WAF events
- Shows total blocks and type-wise counts

### Why It Matters To Laymen
People trust systems more when they can see visible proof of protection.

### Recommended Simulation
`Security CCTV Dashboard Demo`

### Simulation Idea
- Compare WAF logs to security camera records and incident counters.
- The system does not only stop attacks; it remembers what happened.

### Practical Demo Version
- After SQLi and XSS simulations, open the WAF event dashboard.
- Show attack counts increasing in real time.
- Show attack type, route, time, and payload snippet.

### What To Show
- Total blocked attacks
- SQLi blocks
- XSS blocks
- Header blocks
- Event feed

### Visitor Message
"This is like a security control room. It records what kind of attack was stopped and where it happened."

### Why This Is Excellent
- Best supporting demo for the attack simulations
- Gives a strong sense of “real system working”

### Priority
- Very High

---

## 3.9 API Rate Limiting

### Functionality
- Limit how many requests a user can send in a given time window
- Can be configured globally or per route

### Why It Matters To Laymen
Everyone understands spam, overload, and queue abuse.

### Recommended Simulation
`Concert Ticket Rush Demo`

### Simulation Idea
- Compare an API to a ticket counter.
- If one person keeps cutting in line 100 times per second, normal users suffer.
- Rate limiting makes it fair and protects the system.

### Practical Demo Version
- Create a fake “movie ticket booking API” or “canteen order API”.
- One panel simulates a normal user.
- Another panel simulates a spammer pressing the button rapidly.
- With rate limiting OFF, requests keep going.
- With rate limiting ON, later requests get blocked with a visible limit message.

### What To Show
- Route-specific rate limit configuration
- Rapid-fire request button
- Success count vs blocked count
- 429-style message in friendly wording

### Visitor Message
"This stops abuse and keeps the system usable for everyone."

### Why This Is Excellent
- Very easy analogy
- Strong visual effect
- No need to explain deep security terms

### Priority
- Very High

---

## 3.10 API Key Protection

### Functionality
- Protect selected routes with API keys
- Allow only authorized callers for sensitive operations

### Why It Matters To Laymen
This is easy to explain as a digital access card.

### Recommended Simulation
`Staff Room Access Card Demo`

### Simulation Idea
- Some doors are public, some require an access card.
- API keys act like digital access cards for sensitive API routes.

### Practical Demo Version
- Use a fake service such as:
  - hospital records API,
  - school admin API,
  - warehouse inventory API.
- Make one route public, like `GET /products`
- Make one route protected, like `POST /admin/update-stock`
- Show request failing without key and succeeding with key

### What To Show
- Generate new key
- Select protected route
- Make request without key
- Make request with key

### Visitor Message
"Not every feature should be open to everyone. Sensitive actions can require a trusted key."

### Why This Is Good
- Simple mental model
- Looks professional and practical

### Priority
- High

---

## 3.11 OpenAPI / Swagger Detection

### Functionality
- Detect API documentation paths exposed by a service
- Surface docs in the platform UI

### Why It Matters To Laymen
This is useful, but not as emotionally strong as security demos.

### Recommended Simulation
`Instruction Manual Found Automatically Demo`

### Simulation Idea
- The platform finds the service’s instruction manual automatically.
- It helps developers and operators understand how to use the service.

### Practical Demo Version
- Deploy a service with OpenAPI docs
- Show auto-detected docs in the service details page

### Visitor Message
"The platform can automatically discover how a service is supposed to be used."

### Why This Is Good
- Shows convenience and management value

### Limitation
- Less exciting than attack prevention

### Priority
- Medium

---

## 3.12 Service Lifecycle Controls

### Functionality
- Start service
- Stop service
- Redeploy service
- Rename service
- Delete service

### Why It Matters To Laymen
This shows that the platform is not just for blocking attacks; it is also for managing services safely.

### Recommended Simulation
`Machine Room Control Panel Demo`

### Simulation Idea
- Treat each service like a machine in a facility.
- Operators can safely pause, restart, or replace a machine without exposing internals.

### Practical Demo Version
- Use one service card
- Show it running
- Stop it and show status change
- Start it again
- Redeploy it and explain it as “refreshing or rolling out a new version”

### Visitor Message
"The platform helps us control services cleanly without manually handling many low-level systems."

### Why This Is Good
- Useful supporting demo
- Simple management story

### Priority
- Medium

---

## 3.13 Full Dashboard Monitoring

### Functionality
- Unified view for deployment, services, scans, WAF stats, and controls

### Why It Matters To Laymen
People appreciate simplicity. One screen that “shows everything” builds trust quickly.

### Recommended Simulation
`Security Control Center Demo`

### Simulation Idea
- Treat the platform dashboard as the command center of a smart building.
- Operators can see what is running, what is safe, what is under attack, and what needs action.

### Practical Demo Version
- Use this as the backbone of the entire expo flow
- After each attack or scan simulation, return to the dashboard and show its effect there

### Visitor Message
"Instead of using many disconnected tools, this platform brings deployment, protection, and monitoring together."

### Priority
- Very High

---

## 3.14 Graceful Stop Of All Services

### Functionality
- Stop all deployed services cleanly

### Why It Matters To Laymen
This is less flashy, but useful to show responsible shutdown and centralized control.

### Recommended Simulation
`Closing Time Demo`

### Simulation Idea
- At the end of a day, all systems can be shut down from one control panel rather than manually visiting each one.

### Practical Demo Version
- Use only near the end of the expo or during setup/teardown
- Not recommended as a main attraction demo

### Priority
- Low

---

## 4. Best Simulations To Build First

If we want maximum visitor engagement with minimum confusion, these should be built first:

1. SQL Injection demo using a fake login page
2. XSS demo using a fake comments / feedback page
3. Rate limiting demo using a spam request / ticket counter story
4. API key demo using public vs protected route access
5. Trivy scan demo using safe image vs risky image
6. WAF live dashboard demo that supports the SQLi and XSS demos

These six together tell a complete story:
- deploy software,
- inspect it,
- protect it,
- control access,
- stop abuse,
- watch attacks getting blocked.

---

## 5. Suggested Expo Demo Route

This is the recommended sequence for visitors.

### Demo Route A: Best For General Crowd

1. Show the platform dashboard briefly
2. Explain that apps are deployed safely behind one gateway
3. Open SQL injection login simulation
4. Show attack attempt and block
5. Open XSS comments simulation
6. Show malicious comment blocked
7. Open rate limit simulation
8. Show spam requests blocked
9. Open WAF stats and event logs
10. End by showing that the platform records and controls all this centrally

### Demo Route B: Best For Faculty / More Technical Visitors

1. Upload image
2. Run Trivy scan
3. Deploy service
4. Run Nikto scan
5. Show API docs discovery
6. Show API key protection
7. Show WAF toggles and attack blocking

---

## 6. How Each Simulation Should Feel

For expo success, each simulation should follow these principles:

### Principle 1: One clear problem only
- Do not mix too many concepts in one screen.
- Each simulation should answer one question:
  - "What is SQL injection?"
  - "What is XSS?"
  - "Why do we limit requests?"

### Principle 2: Obvious before/after
- Before protection: risky behavior is possible or appears dangerous
- After protection: blocked, denied, or controlled

### Principle 3: Simple labels
Prefer:
- "Attack blocked"
- "Too many requests"
- "Protected route"
- "Unsafe image found"

Avoid overusing:
- "regex signature"
- "serialized payload"
- "reverse proxy middleware"

### Principle 4: Use familiar domains
Good demo themes:
- student login
- feedback form
- ticket booking
- hospital records
- inventory management
- cafe ordering

### Principle 5: Show proof
Every demo should end with visible evidence:
- status changed
- request rejected
- event count increased
- vulnerability found
- protected action allowed only with key

---

## 7. Suggested Mapping Between Features And Demo Assets

These are the most suitable demo assets to create later inside `simulation`.

### Simulation Asset 1
- Name: `student-login-demo`
- Feature: SQL injection protection
- Interface: login page
- Core proof: injected input blocked and logged

### Simulation Asset 2
- Name: `feedback-wall-demo`
- Feature: XSS protection
- Interface: comment form and comment wall
- Core proof: malicious script rejected and logged

### Simulation Asset 3
- Name: `ticket-rush-demo`
- Feature: rate limiting
- Interface: request flood simulator
- Core proof: normal requests pass, spam gets blocked

### Simulation Asset 4
- Name: `staff-access-demo`
- Feature: API key protection
- Interface: public and protected API actions
- Core proof: protected route fails without key and works with key

### Simulation Asset 5
- Name: `image-health-demo`
- Feature: Trivy image scanning
- Interface: scan status and findings comparison
- Core proof: risky image visibly flagged

### Simulation Asset 6
- Name: `security-control-center-demo`
- Feature: WAF logs and global visibility
- Interface: live dashboard with counters
- Core proof: blocked attacks appear in stats and event feed

---

## 8. Final Recommendation

The strongest overall expo story is not "we built a Kubernetes project."

The strongest story is:

"People and organizations want to deploy apps quickly, but unsafe apps and unsafe traffic create real risk. Our platform helps deploy services in a controlled way, scan them for weaknesses, and block common attacks through one secure gateway."

If only a few simulations are built, the best combination is:

1. SQL injection demo
2. XSS demo
3. Rate limiting demo
4. Trivy image scan demo
5. WAF event dashboard demo

That set will likely create the clearest understanding and strongest visitor reaction.

---

## 9. Next Recommended Step

Pick one of these to design first:

1. SQL injection login simulation
2. XSS comment-wall simulation
3. Rate limiting spam-control simulation
4. Trivy scan comparison simulation
5. API key protected-route simulation

Once one is chosen, the next planning file should define:
- exact screen layout,
- storyline,
- what visitor clicks,
- what should happen before and after protection,
- what backend behavior must be simulated,
- what text should appear for a layman.
