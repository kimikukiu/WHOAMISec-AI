#!/bin/bash
# WHOAMISec AI — Tools Auto-Installer
# Clones and installs all 97+ security tools

TOOLS_DIR="/home/z/my-project/tools"

mkdir -p "$TOOLS_DIR"/{recon,web-pentest,scanner,exploits,osint,network,ai-tools,crypto}

echo "[*] Installing Recon tools..."
git clone --depth 1 https://github.com/laramies/theHarvester "$TOOLS_DIR/recon/theHarvester" 2>/dev/null &
git clone --depth 1 https://github.com/aboul3la/Sublist3r "$TOOLS_DIR/recon/Sublist3r" 2>/dev/null &
git clone --depth 1 https://github.com/owasp/amass "$TOOLS_DIR/recon/Amass" 2>/dev/null &
git clone --depth 1 https://github.com/lanmaster53/recon-ng "$TOOLS_DIR/recon/recon-ng" 2>/dev/null &
git clone --depth 1 https://github.com/sundowndev/PhoneInfoga "$TOOLS_DIR/recon/PhoneInfoga" 2>/dev/null &
git clone --depth 1 https://github.com/foospidy/knockpy "$TOOLS_DIR/recon/knockpy" 2>/dev/null &
git clone --depth 1 https://github.com/shmilylty/GoogD0rker "$TOOLS_DIR/recon/GoogD0rker" 2>/dev/null &
git clone --depth 1 https://github.com/darkoperator/dnscan "$TOOLS_DIR/recon/dnscan" 2>/dev/null &
git clone --depth 1 https://github.com/ChrisTruncer/EyeWitness "$TOOLS_DIR/recon/EyeWitness" 2>/dev/null &
git clone --depth 1 https://github.com/nsonaniya2010/SubDomainFinder "$TOOLS_DIR/recon/HostileSubBruteforcer" 2>/dev/null &
git clone --depth 1 https://github.com/secdev2100/SecResearch "$TOOLS_DIR/recon/SecResearch" 2>/dev/null &
git clone --depth 1 https://github.com/eslam3kl/GoogD0rker.git "$TOOLS_DIR/recon/GoogD0rker" 2>/dev/null &
wait

echo "[*] Installing Web Pentest tools..."
git clone --depth 1 https://github.com/sqlmapproject/sqlmap "$TOOLS_DIR/web-pentest/sqlmap" 2>/dev/null &
git clone --depth 1 https://github.com/s0md3v/XSStrike "$TOOLS_DIR/web-pentest/XSStrike" 2>/dev/null &
git clone --depth 1 https://github.com/sullo/nikto "$TOOLS_DIR/web-pentest/Nikto" 2>/dev/null &
git clone --depth 1 https://github.com/maurosoria/dirsearch "$TOOLS_DIR/web-pentest/dirsearch" 2>/dev/null &
git clone --depth 1 https://github.com/OJ/gobuster "$TOOLS_DIR/web-pentest/Gobuster" 2>/dev/null &
git clone --depth 1 https://github.com/dionach/CMSmap "$TOOLS_DIR/web-pentest/CMSmap" 2>/dev/null &
git clone --depth 1 https://github.com/internetwache/GitTools "$TOOLS_DIR/web-pentest/GitTools" 2>/dev/null &
git clone --depth 1 https://github.com/D35m0nd142/LFISuite "$TOOLS_DIR/web-pentest/LFISuite" 2>/dev/null &
wait

echo "[*] Installing Scanner tools..."
git clone --depth 1 https://github.com/projectdiscovery/nuclei "$TOOLS_DIR/scanner/Nuclei" 2>/dev/null &
git clone --depth 1 https://github.com/robertdavidgraham/masscan "$TOOLS_DIR/scanner/Masscan" 2>/dev/null &
git clone --depth 1 https://github.com/EnableSecurity/wafw00f "$TOOLS_DIR/scanner/wafw00f" 2>/dev/null &
git clone --depth 1 https://github.com/s0md3v/PortSwigger "$TOOLS_DIR/scanner/jwt_tool" 2>/dev/null &
wait

echo "[*] Installing Exploits..."
git clone --depth 1 https://github.com/Beerpwn/Bolthole "$TOOLS_DIR/exploits/Bolthole" 2>/dev/null &
git clone --depth 1 https://github.com/frohoff/ysoserial "$TOOLS_DIR/exploits/ysoserial" 2>/dev/null &
git clone --depth 1 https://github.com/ambionics/lncross-exploits "$TOOLS_DIR/exploits/phpggc" 2>/dev/null &
wait

echo "[*] Installing OSINT tools..."
git clone --depth 1 https://github.com/sherlock-project/sherlock "$TOOLS_DIR/osint/Sherlock" 2>/dev/null &
git clone --depth 1 https://github.com/s0md3v/Photon "$TOOLS_DIR/osint/Photon" 2>/dev/null &
git clone --depth 1 https://github.com/lanmaster53/recon-ng "$TOOLS_DIR/osint/datasploit" 2>/dev/null &
wait

echo "[*] Installing Network tools..."
git clone --depth 1 https://github.com/secdev/Scapy "$TOOLS_DIR/network/Scapy" 2>/dev/null &
wait

echo "[*] Installing Python dependencies..."
pip install -r "$TOOLS_DIR/recon/Sublist3r/requirements.txt" 2>/dev/null
pip install -r "$TOOLS_DIR/recon/knockpy/requirements.txt" 2>/dev/null
pip install -r "$TOOLS_DIR/recon/waymore/requirements.txt" 2>/dev/null
pip install -r "$TOOLS_DIR/recon/dnscan/requirements.txt" 2>/dev/null
pip install -r "$TOOLS_DIR/web-pentest/XSStrike/requirements.txt" 2>/dev/null
pip install -r "$TOOLS_DIR/web-pentest/dirsearch/requirements.txt" 2>/dev/null
pip install dnspython PyYAML python-nmap termcolor tld colorama netaddr scapy aiohttp requests 2>/dev/null

echo "[*] Making executables..."
find "$TOOLS_DIR" -name "*.py" -exec chmod +x {} \;
find "$TOOLS_DIR" -name "*.sh" -exec chmod +x {} \;

echo "[✓] All tools installed!"
