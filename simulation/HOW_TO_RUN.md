# How to Run (8GB RAM Optimized)

Follow these steps to run the Secure Microservice Deployer without overwhelming your system memory.

---

### 1. Open Git Bash
Search for "Git Bash" in your Windows Start menu and open it.

---

### 2. Go to the Project Folder
Copy and paste this command into Git Bash to enter your project directory:
```bash
cd "/c/Users/ARTH PATEL/OneDrive/Desktop/ARTH/Sem-6/Cyber/Project/SEI-M-D"
```

---

### 3. Start the Core Platform
Run this script to start the namespaces, Redis, Backend, Gateway, and Frontend. It waits for Redis to be healthy before continuing.
```bash
./simulation/scripts/start-platform-foundation.sh
```
*Wait until you see: "Dashboard is ready at: http://localhost:30000"*

---

### 4. Use the Dashboard
1. Open your browser to: **http://localhost:30000**
2. Upload your demo services (like `example-api.tar`) through the UI.

---

### 5. Control Demos One-by-One
To save RAM, only start the demo you are currently testing.

**To Start a Demo:**
```bash
./simulation/scripts/start-demo.sh xss    # Options: sql, xss, rate, api
```

**To Stop a Demo (Reclaim RAM):**
```bash
./simulation/scripts/stop-demo.sh xss
```

---

### 6. Cleanup Everything
When you are finished, run this to shut everything down and free up all RAM:
```bash
./simulation/scripts/cleanup-all.sh
```

> [!TIP]
> **Why this method?**
> The standard `./run.sh` starts every service at once, including memory-heavy scanners. This "One-by-One" method gives you manual control and skips the scanners entirely, keeping your RAM usage low and your system stable.
