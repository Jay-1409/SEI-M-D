# Vulnerable API - Testing Application

⚠️ **WARNING: This application contains INTENTIONAL security vulnerabilities for testing the Nikto scanner. DO NOT use in production!**

## Purpose

This Flask application is designed to be scanned by Nikto to demonstrate vulnerability detection capabilities. It contains common and **CRITICAL** web application security issues.

## Vulnerabilities Included

### Information Disclosure
1. **Debug Mode Enabled** - Flask debug mode active
2. **Missing Security Headers** - No X-Frame-Options, CSP, X-Content-Type-Options
3. **Server Info Disclosure** - `/server-status` exposes version + SECRET_KEY
4. **Environment Disclosure** - `/env` exposes all environment variables
5. **Debug/Trace Endpoints** - `/debug`, `/trace` leak request information

### Authentication & Access Control
6. **Unprotected Admin Panel** - `/admin` without authentication
7. **Weak Default Credentials** - admin/admin123
8. **Hardcoded Secrets** - SECRET_KEY, DB passwords in code

### File & Directory Exposure
9. **Directory Listing** - `/files/` with directory traversal
10. **Exposed .git Directory** - `/.git/config` accessible
11. **Backup File Exposure** - `/backup.sql`, `/database.bak`, `/db.sql`
12. **Config Files Exposed** - `/config.php`, `/wp-config.php`
13. **Dangerous Default Files** - `/test.php`, `/phpinfo.php`, `/info.php`

### Injection Vulnerabilities
14. **SQL Injection** - `/search` endpoint (simulated)
15. **Cross-Site Scripting (XSS)** - `/comment` endpoint
16. 🔴 **Command Injection** - `/ping` executes shell commands
17. 🔴 **Server-Side Template Injection (SSTI)** - `/render` endpoint
18. 🔴 **Insecure Deserialization** - `/deserialize` uses pickle

## 🔴 CRITICAL Vulnerabilities

These vulnerabilities allow **Remote Code Execution (RCE)**:

- **Command Injection** (`/ping?host=`) - Execute arbitrary OS commands
- **SSTI** (`/render?template=`) - Execute arbitrary Python code via templates
- **Insecure Deserialization** (`/deserialize?data=`) - Execute arbitrary code via pickle

## Building and Testing

### Quick Start:
```bash
./scripts/build-vulnerable.sh
```

### Manual Build:
```bash
cd examples/vulnerable-api
docker build -t vulnerable-api:latest .
docker save vulnerable-api:latest -o vulnerable-api.tar
```

### Deploy via the platform:
1. Upload `vulnerable-api.tar` via the frontend at `http://localhost:30000`
2. Deploy with service name `vulnerable-api` and port `8000`
3. Click **"Scan"** to run Nikto vulnerability scan
4. View the detected vulnerabilities!

## Expected Nikto Findings

Nikto should detect:
- Server version disclosure
- Directory indexing enabled
- Presence of dangerous files (test.php, phpinfo.php, config.php)
- Exposed administrative interfaces (/admin)
- Missing security headers
- Backup files accessible (.sql, .bak)
- .git directory exposure
- Debug/trace endpoints
- Potentially indicators of injection vulnerabilities

## Accessing the App

Once deployed, access via: `http://localhost:30080/vulnerable-api`

Visit `/` to see a complete list of all vulnerable endpoints with descriptions.

---

**Remember: This is for educational/testing purposes only! Never deploy this in production!**

