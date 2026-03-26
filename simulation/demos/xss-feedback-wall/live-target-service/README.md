# Live Target Service For The XSS Demo

This small FastAPI service exists only to support the live gateway-connected XSS feedback wall demo.

Routes:

- `GET /comments`
- `POST /comments`
- `POST /demo/reset`

Behavior:

- normal comments are accepted and returned to the wall
- XSS-style comments are also accepted if they reach the service
- the service never executes the payload; it only stores and returns the text with a `kind` marker
- reset restores the original seeded safe comments

That means:

- if gateway XSS protection is OFF, the attack payload can reach this service and the demo shows a dangerous comment accepted
- if gateway XSS protection is ON, the gateway should block the payload before this service stores it

## Run locally

```bash
cd simulation/demos/xss-feedback-wall/live-target-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/docs`

## Build the image tar for platform deployment

```bash
docker build -t expo-xss-demo:latest .
docker save expo-xss-demo:latest -o expo-xss-demo.tar
```

PowerShell helper:

- [build-demo-target.ps1](C:\Users\ARTH PATEL\OneDrive\Desktop\ARTH\Sem-6\Cyber\Project\SEI-M-D\simulation\demos\xss-feedback-wall\live-target-service\build-demo-target.ps1)

Suggested deployment values:

- `Service Name`: `expo-xss-demo`
- `Container Port`: `8000`

Gateway routes:

- `http://localhost:30080/expo-xss-demo/comments`
- `http://localhost:30080/expo-xss-demo/demo/reset`

Suggested platform setup:

1. Open the service details page for `expo-xss-demo`.
2. Open the `Firewall` tab.
3. Turn `XSS Protection` ON when you want the attack blocked.
4. Turn `XSS Protection` OFF when you want the vulnerable live pass-through behavior.
5. Clear WAF logs before the live proof run if you want a clean counter.

Quick test:

```bash
curl -X POST http://localhost:30080/expo-xss-demo/comments -H "Content-Type: application/json" -d "{\"author\":\"Aarav\",\"comment\":\"Great event. The project demos were easy to understand.\"}"
curl -X POST http://localhost:30080/expo-xss-demo/comments -H "Content-Type: application/json" -d "{\"author\":\"Attacker\",\"comment\":\"<script>alert('demo')</script>\"}"
```

Expected result:

- with XSS protection OFF, the second request should return `201`
- with XSS protection ON, the second request should return a gateway WAF `403`
