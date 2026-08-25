import React, { useState, useRef, useEffect } from 'react';
import { VpsInstance } from '../../types';

interface VpsWebTerminalProps {
  vps: VpsInstance;
}

export const VpsWebTerminal: React.FC<VpsWebTerminalProps> = ({ vps }) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    {
      type: 'output',
      text: `Connected to ${vps.hostname} (${vps.ipAddress})\nNexusCloud Secure Web Terminal v2.4\nType 'help' to see available commands.\n`,
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const newHistory = [...history, { type: 'input' as const, text: `root@${vps.name}:~# ${cmd}` }];

    switch (cmd.toLowerCase()) {
      case 'help':
        newHistory.push({
          type: 'output',
          text: `Available commands:\n  htop        - View real-time interactive process list\n  neofetch    - Display system specs & OS details\n  docker ps   - List active Docker containers\n  uptime      - Show server uptime and load averages\n  free -m     - Show RAM allocation\n  ip a        - Display network interface and IP addresses\n  clear       - Clear terminal screen\n`,
        });
        break;
      case 'clear':
        setHistory([]);
        setInputVal('');
        return;
      case 'uptime':
        newHistory.push({
          type: 'output',
          text: ` 04:45:12 up 12 days,  4:32,  1 user,  load average: 0.18, 0.24, 0.19\n`,
        });
        break;
      case 'neofetch':
        newHistory.push({
          type: 'output',
          text: `
       _,met$$$$$gg.          root@${vps.name}
    ,g$$$$$$$$$$$$$$$P.       -----------------------
  ,g$$P"     """Y$$.".        OS: ${vps.osVersion}
 ,$$P'              \`$$$.     Kernel: ${vps.kernelVersion}
',$$P       ,ggs.     \`$$b:   Uptime: 12 days, 4 hours
\`d$$'     ,$P"'   .    $$$    Packages: 684 (dpkg)
 $$P      d$'     ,    $$P    Shell: bash 5.2.21
 $$:      $$.   -    ,d$$'    CPU: AMD EPYC 9654 (${vps.planDetails.vCPU}) @ 3.400GHz
 \`$$;     Y$b._   _,d$P'      Memory: 3440MiB / ${vps.planDetails.ramGB * 1024}MiB
  Y$$.    \`."Y$$$$P"'         Disk: 38G / ${vps.planDetails.storageGB}G (48%)
   \`$$b      "-.__
`,
        });
        break;
      case 'docker ps':
        newHistory.push({
          type: 'output',
          text: `CONTAINER ID   IMAGE                 COMMAND                  CREATED        STATUS        PORTS                    NAMES
8f9e01ab2c3d   traefik:v3.0          "/entrypoint.sh trae…"   3 days ago     Up 3 days     0.0.0.0:80->80/tcp       reverse-proxy
4a1b2c3d4e5f   n8nio/n8n:latest      "tini -- /docker-ent…"   2 days ago     Up 2 days     0.0.0.0:5678->5678/tcp   n8n-workflow
`,
        });
        break;
      case 'free -m':
        newHistory.push({
          type: 'output',
          text: `               total        used        free      shared  buff/cache   available
Mem:            8192        3440        2890         128        1862        4624
Swap:           2048           0        2048
`,
        });
        break;
      case 'ip a':
        newHistory.push({
          type: 'output',
          text: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default
    inet ${vps.ipAddress}/24 brd 200.234.41.255 scope global dynamic eth0
    inet6 ${vps.ipv6Address || '2a02:4780:11:1010::1'}/64 scope global
`,
        });
        break;
      case 'htop':
        newHistory.push({
          type: 'output',
          text: `[||||||||||||||                23.4%]   Tasks: 48 total, 1 running, 47 sleeping
[||||||||||||||||||||||        42.0%]   Load average: 0.18 0.24 0.19
Mem[|||||||||||||||||    3.36G/8.00G]   Uptime: 12 days, 04:32:10

  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command
 1042 root       20   0  782M  194M 42.1M S  4.2  2.4  4:12.30 traefik
 1489 node       20   0  1.2G  410M 38.0M S  2.8  5.1 18:45.12 node /n8n/index.js
  842 root       20   0  145M 18.2M  8.4M S  0.3  0.2  0:42.15 systemd-journal
`,
        });
        break;
      default:
        newHistory.push({
          type: 'output',
          text: `bash: ${cmd}: command not found. Type 'help' for available commands.\n`,
        });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  return (
    <div className="terminal-window" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
        </div>
        <div className="terminal-title">Web SSH Console • {vps.hostname}</div>
        <div style={{ fontSize: '0.7rem', color: '#58a6ff', fontWeight: 600 }}>Connected (KVM VNC)</div>
      </div>

      <div className="terminal-body">
        {history.map((h, i) => (
          <pre
            key={i}
            style={{
              margin: 0,
              fontFamily: 'inherit',
              color: h.type === 'input' ? '#58a6ff' : '#c9d1d9',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {h.text}
          </pre>
        ))}

        <form onSubmit={handleCommand} className="terminal-input-row">
          <span className="terminal-prompt">root@{vps.name}:~#</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            autoFocus
            spellCheck={false}
          />
        </form>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
