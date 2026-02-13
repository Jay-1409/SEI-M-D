"""
Vulnerable API - FOR TESTING PURPOSES ONLY
This application intentionally contains security vulnerabilities for testing Nikto scanner
DO NOT USE IN PRODUCTION
"""

from flask import Flask, request, render_template_string, send_from_directory
import os

app = Flask(__name__)

# Vulnerability 1: Debug mode enabled (information disclosure)
app.config['DEBUG'] = True

# Vulnerability 2: Missing security headers
@app.after_request
def remove_security_headers(response):
    # Intentionally not setting security headers
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
        'debug': app.config['DEBUG']
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
def backup_files():
    """Exposed backup files"""
    return "-- Database backup\nCREATE TABLE users...", 200, {'Content-Type': 'text/plain'}

@app.route('/')
def index():
    return """
    <h1>Vulnerable API - Test Application</h1>
    <p><strong>⚠️ WARNING: This application contains intentional security vulnerabilities for testing purposes only!</strong></p>
    <h2>Vulnerable Endpoints:</h2>
    <ul>
        <li><a href="/files/">/files/</a> - Directory listing</li>
        <li><a href="/server-status">/server-status</a> - Server info disclosure</li>
        <li><a href="/test.php">/test.php</a> - Dangerous PHP files</li>
        <li><a href="/admin">/admin</a> - Unprotected admin panel</li>
        <li><a href="/search?q=test">/search</a> - SQL injection</li>
        <li><a href="/comment">/comment</a> - XSS vulnerability</li>
        <li><a href="/.git/config">/.git/config</a> - Exposed .git</li>
        <li><a href="/backup.sql">/backup.sql</a> - Backup file exposure</li>
    </ul>
    """

@app.route('/health')
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    # Running in debug mode on all interfaces - insecure!
    app.run(host='0.0.0.0', port=8000, debug=True)
