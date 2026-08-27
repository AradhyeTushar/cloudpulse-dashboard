#!/usr/bin/env python3
import sys
import pexpect

PASSWORD = "@23+KSzTWya05g)F"
HOST = "root@200.234.41.58"
PROMPT = r"root@srv1920898:.*# "

def run_remote(cmd, timeout=600):
    child = pexpect.spawn(f"ssh -o StrictHostKeyChecking=no {HOST}", encoding="utf-8", timeout=timeout)
    i = child.expect(["password:", "Password:", pexpect.EOF, pexpect.TIMEOUT], timeout=15)
    if i not in [0, 1]:
        print("Failed to get password prompt")
        sys.exit(1)
    
    child.sendline(PASSWORD)
    child.expect(PROMPT)
    
    # Send command
    child.sendline(cmd)
    child.expect(PROMPT, timeout=timeout)
    
    output = child.before.strip()
    print(output)
    
    child.sendline("exit")
    child.close()
    return 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 vps_exec.py '<command>'")
        sys.exit(1)
    
    command = " ".join(sys.argv[1:])
    ret = run_remote(command, timeout=900)
    sys.exit(ret)
