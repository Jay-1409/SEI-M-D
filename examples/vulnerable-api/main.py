"""
Vulnerable API - FOR TESTING PURPOSES ONLY
This application intentionally contains security vulnerabilities for testing Nikto scanner
DO NOT USE IN PRODUCTION
"""

from flask import Flask, request, render_template_string, send_from_directory, jsonify
import os
import subprocess
import pickle
import base64

app = Flask(__name__)

# Vulnerability 1: Debug mode enabled (information disclosure)
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'super-secret-key-12345'  # Hardcoded secret

# Hardcoded credentials (CRITICAL)
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"
DB_PASSWORD = "root"

# Vulnerability 2: Missing security headers
@app.after_request
def remove_security_headers(response):
    # Intentionally not setting security headers
    response.headers.pop('X-Content-Type-Options', None)
    response.headers.pop('X-Frame-Options', None)
    return response

# Vulnerability 3: Directory listing exposure
@app.route('/files/')
@app.route('/files/<path:filename>')
def files(filename=None):
    """Exposes file system - directory traversal vulnerability"""
    if filename:
        return send_from_directory('.', filename)
    files = os.listdir('.')
    return '<br>'.join(files)

# Vulnerability 4: Server version disclosure
@app.route('/server-status')
def server_status():
    """Discloses server information"""
    return {
        'server': 'Flask/2.0.1',
        'python_version': '3.11',
        'debug': app.config['DEBUG'],
        'secret_key': app.config['SECRET_KEY']  # CRITICAL: Exposing secret key
    }

# Vulnerability 5: Common test/default files
@app.route('/test.php')
@app.route('/phpinfo.php')
@app.route('/info.php')
def php_info():
    """Simulates presence of dangerous PHP files"""
    return "<?php phpinfo(); ?>", 200, {'Content-Type': 'text/plain'}

# Vulnerability 6: Admin panel without authentication
@app.route('/admin')
def admin():
    """Unprotected admin interface"""
    return """
    <h1>Admin Panel</h1>
    <p>This should be protected but isn't!</p>
    <ul>
        <li><a href="/admin/users">Manage Users</a></li>
        <li><a href="/admin/config">Server Config</a></li>
        <li><a href="/admin/execute">Execute Commands</a></li>
    </ul>
    """

# Vulnerability 7: SQL Injection potential (simulated)
@app.route('/search')
def search():
    """Vulnerable search endpoint"""
    query = request.args.get('q', '')
    # Intentionally vulnerable to SQL injection
    return f"Searching for: {query} (query would be: SELECT * FROM users WHERE name='{query}')"

# Vulnerability 8: XSS vulnerability
@app.route('/comment', methods=['GET', 'POST'])
def comment():
    """Cross-site scripting vulnerability"""
    if request.method == 'POST':
        user_input = request.form.get('comment', '')
        # Renders user input without escaping
        return render_template_string(f"<h2>Your comment:</h2><p>{user_input}</p>")
    return '''
        <form method="POST">
            <textarea name="comment"></textarea>
            <button type="submit">Submit</button>
        </form>
    '''

# Vulnerability 9: Exposed .git directory (simulated)
@app.route('/.git/config')
def git_config():
    """Simulates exposed git configuration"""
    return """[core]
    repositoryformatversion = 0
    filemode = true
[remote "origin"]
    url = https://github.com/example/vulnerable-app.git
"""

# Vulnerability 10: Backup files exposed
@app.route('/backup.sql')
@app.route('/database.bak')
@app.route('/db.sql')
def backup_files():
    """Exposed backup files"""
    return f"-- Database backup\nCREATE TABLE users...\nINSERT INTO users VALUES ('admin', '{ADMIN_PASS}');", 200, {'Content-Type': 'text/plain'}

# CRITICAL Vulnerability 11: Command Injection
@app.route('/ping')
def ping():
    """CRITICAL: Command injection vulnerability"""
    host = request.args.get('host', 'localhost')
    # Dangerously executing user input
    try:
        result = subprocess.check_output(f"ping -c 1 {host}", shell=True, stderr=subprocess.STDOUT, timeout=5)
        return f"<pre>{result.decode()}</pre>"
    except Exception as e:
        return f"Error: {str(e)}"

# CRITICAL Vulnerability 12: Insecure Deserialization
@app.route('/deserialize')
def deserialize():
    """CRITICAL: Insecure deserialization"""
    data = request.args.get('data', '')
    try:
        decoded = base64.b64decode(data)
        obj = pickle.loads(decoded)  # DANGEROUS!
        return f"Deserialized: {obj}"
    except Exception as e:
        return f"Error: {str(e)}"

# CRITICAL Vulnerability 13: Server-Side Template Injection (SSTI)
@app.route('/render')
def render():
    """CRITICAL: Server-Side Template Injection"""
    template = request.args.get('template', 'Hello World')
    # Directly rendering user input as template
    return render_template_string(template)

# Vulnerability 14: Weak/Default Credentials
@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login with weak credentials"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USER and password == ADMIN_PASS:
            return jsonify({"status": "success", "message": "Logged in!", "token": "abc123"})
        return jsonify({"status": "error", "message": "Invalid credentials"})
    return '''
        <form method="POST">
            <input name="username" placeholder="Username (try: admin)"><br>
            <input name="password" type="password" placeholder="Password (try: admin123)"><br>
            <button type="submit">Login</button>
        </form>
    '''

# Vulnerability 15: Environment variable disclosure
@app.route('/env')
def show_env():
    """Exposes environment variables"""
    return jsonify(dict(os.environ))

# Vulnerability 16: Exposed config files
@app.route('/config.php')
@app.route('/wp-config.php')
@app.route('/config.inc.php')
def config_files():
    """Simulates exposed config files"""
    return f"""<?php
define('DB_PASSWORD', '{DB_PASSWORD}');
define('DB_USER', 'root');
define('DB_HOST', 'localhost');
?>""", 200, {'Content-Type': 'text/plain'}

# Vulnerability 17: Debug/trace endpoints
@app.route('/trace')
@app.route('/debug')
def debug_trace():
    """Debug endpoints that leak information"""
    return jsonify({
        "request_headers": dict(request.headers),
        "cookies": dict(request.cookies),
        "method": request.method,
        "path": request.path
    })

@app.route('/')
def index():
    return """
    <h1>Vulnerable API - Test Application</h1>
    <p><strong>⚠️ WARNING: This application contains intentional security vulnerabilities for testing purposes only!</strong></p>
    <h2>Vulnerable Endpoints:</h2>
    <ul>
        <li><a href="/files/">/files/</a> - Directory listing</li>
        <li><a href="/server-status">/server-status</a> - Server info disclosure (+ SECRET KEY!)</li>
        <li><a href="/test.php">/test.php</a> - Dangerous PHP files</li>
        <li><a href="/admin">/admin</a> - Unprotected admin panel</li>
        <li><a href="/search?q=test">/search</a> - SQL injection</li>
        <li><a href="/comment">/comment</a> - XSS vulnerability</li>
        <li><a href="/.git/config">/.git/config</a> - Exposed .git</li>
        <li><a href="/backup.sql">/backup.sql</a> - Backup file exposure</li>
        <li><a href="/ping?host=localhost">/ping</a> - 🔴 CRITICAL: Command Injection</li>
        <li><a href="/render?template=Hello">/render</a> - 🔴 CRITICAL: SSTI</li>
        <li><a href="/deserialize">/deserialize</a> - 🔴 CRITICAL: Insecure Deserialization</li>
        <li><a href="/login">/login</a> - Weak credentials (admin/admin123)</li>
        <li><a href="/env">/env</a> - Environment disclosure</li>
        <li><a href="/config.php">/config.php</a> - Exposed config</li>
        <li><a href="/debug">/debug</a> - Debug trace</li>
    </ul>
    <h3>🔴 CRITICAL Vulnerabilities:</h3>
    <ul>
        <li>Command Injection via /ping</li>
        <li>Server-Side Template Injection via /render</li>
        <li>Insecure Deserialization via /deserialize</li>
        <li>Hardcoded credentials exposed</li>
    </ul>
    """

@app.route('/health')
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    # Running in debug mode on all interfaces - insecure!
    app.run(host='0.0.0.0', port=8000, debug=True)

