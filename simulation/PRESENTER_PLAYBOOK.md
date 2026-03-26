# Presenter Playbook

Last updated: 2026-03-23

## Short Intro

`This project shows how we deploy microservices through one controlled gateway and then apply security checks that are easy to explain and easy to prove on screen.`

Longer 20-second version:

`We built a secure microservice deployer that helps an operator deploy services, scan them, and protect them at the gateway. For the expo, we use a mix of real platform flows and simple simulations so visitors can understand the risk and the protection in under a minute.`

## Per-Demo Explanation

### Deployment and gateway access

`This is the foundation story. The service stays inside the platform, and the gateway becomes the public front door.`

### Trivy image scan

`Before trusting a container image, we inspect what is inside it. Trivy gives visible counts instead of guesswork.`

### Nikto live scan

`Trivy checks the image contents. Nikto checks the running web service behavior after deployment.`

### SQL injection demo

`This is a fake login trick. The same malicious input succeeds in vulnerable mode and fails in protected mode.`

### XSS feedback wall demo

`Normal comments should appear. Hidden script-style code should not.`

### Rate limiting demo

`This one is about fairness. One bot should not be allowed to flood the line and ruin the service for everyone else.`

### API key protection demo

`Not everything should be locked, but sensitive actions should require proof of access.`

### WAF logs and stats

`This is the proof screen. The gateway is not only blocking the attack; it is also recording what happened.`

## 3-5 Minute Full Route

1. Start from the real platform with deployment and gateway access.
2. Show Trivy or Nikto, depending on which is already prepared and faster that day.
3. Open the SQL injection custom demo and show the same attack with OFF and ON.
4. Open the XSS custom demo and show the wall change in OFF mode, then the block in ON mode.
5. Open the rate limiting demo and run the flood with protection ON after briefly explaining the OFF story.
6. Open the API key demo and end on the simpler `public route vs protected route` distinction.
7. If time allows, finish on the WAF logs screen as the real proof layer behind the attack stories.

Suggested full script:

`First, we deploy services through one gateway instead of exposing each service directly. Then we can inspect what we deploy with security checks like Trivy or Nikto. After that, these simulations make the risks easy to understand: SQL injection is a fake login trick, XSS is hidden code inside a public comment, rate limiting preserves fairness when bots flood the line, and API keys protect sensitive actions while public information can stay open. Finally, the WAF screen shows the real proof that suspicious traffic was blocked and logged.`

## Short Fast Route

1. Open SQL injection and show `same attack, different result`.
2. Open XSS and show `normal feedback allowed, hidden code blocked`.
3. Open rate limiting and point to blocked `429` proof.
4. End on API key protection or WAF logs, depending on the audience.

Fast script:

`We use the gateway to stop common web attacks and abusive traffic. Here the same fake-login input is blocked, here hidden script content is stopped before it reaches the page, and here a bot flood gets throttled with 429 responses so normal users still succeed.`

## Likely Visitor Questions

- `Is this a real attack?`
  Answer: `The custom demos are safe simulations built for explanation. The platform scans and firewall screens are real platform flows.`

- `Why not just block everything?`
  Answer: `Because real users still need normal access. The goal is safe access, not zero access.`

- `Why are there both simulations and real screens?`
  Answer: `The simulations make the idea easy for visitors. The real platform screens prove the project can actually deploy, scan, and log security behavior.`

## Likely Faculty Or Judge Questions

- `Which parts are simulated and which are real?`
  Answer: `The four custom demos in simulation are self-contained educational frontends. Deployment, Trivy, Nikto, and WAF monitoring are intended as real platform presentation flows.`

- `Why choose these four custom demos?`
  Answer: `They are the clearest stories for layman visitors: fake login trick, hidden code in a comment, unfair flooding, and access control on sensitive routes.`

- `What remains after this expo integration pass?`
  Answer: `Mainly deeper verification, any optional guides like OpenAPI or service controls, and final rehearsal against the exact expo machine setup.`
