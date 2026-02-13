# Vulnerable API - Testing Application

⚠️ **WARNING: This application contains INTENTIONAL security vulnerabilities for testing the Nikto scanner. DO NOT use in production!**

## Purpose

This Flask application is designed to be scanned by Nikto to demonstrate vulnerability detection capabilities. It contains common web application security issues.

## Vulnerabilities Included

1. **Debug Mode Enabled** - Information disclosure
2. **Missing Security Headers** - No X-Frame-Options, CSP, etc.
3. **Directory Listing** - File system exposure via `/files/`
4. **Server Info Disclosure** - `/server-status` endpoint
5. **Dangerous Default Files** - `/test.php`, `/phpinfo.php`
6. **Unprotected Admin Panel** - `/admin` without authentication
7. **SQL Injection** - Vulnerable `/search` endpoint
8. **Cross-Site Scripting (XSS)** - `/comment` endpoint
9. **Exposed .git Directory** - `/.git/config` accessible
10. **Backup File Exposure** - `/backup.sql`, `/database.bak`

## Building and Testing

### Build the image:
```bash
cd examples/vulnerable-api
docker build -t vulnerable-api:latest .
docker save vulnerable-api:latest -o vulnerable-api.tar
```

### Deploy via the platform:
1. Upload `vulnerable-api.tar` via the frontend
2. Deploy with service name `vulnerable-api` and port `8000`
3. Click "Scan" to run Nikto vulnerability scan
4. View the detected vulnerabilities!

## Expected Nikto Findings

Nikto should detect:
- Server version disclosure
- Directory indexing enabled
- Presence of dangerous files (test.php, phpinfo.php)
- Exposed administrative interfaces
- Missing security headers
- Backup files accessible
- .git directory exposure

## Accessing the App

Once deployed, access via: `http://localhost:30080/vulnerable-api`

Visit `/` to see a list of all vulnerable endpoints.

---

**Remember: This is for educational/testing purposes only!**
