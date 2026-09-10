#!/usr/bin/env python3
"""Walk every print( in the given Swift files and report whether it sits inside an #if DEBUG block.
Also flag prints whose argument text mentions url/URL/absoluteString/link/secret."""
import re, sys
for path in sys.argv[1:]:
    stack = []  # each entry: the #if condition text
    with open(path, encoding='utf-8') as fh:
        for n, line in enumerate(fh, 1):
            s = line.strip()
            if s.startswith('#if '):
                stack.append(s[4:])
            elif s.startswith('#elseif') or s.startswith('#else'):
                if stack: stack[-1] = 'ELSE-of(' + stack[-1] + ')'
            elif s.startswith('#endif'):
                if stack: stack.pop()
            if re.search(r'\bprint\(', line) and not s.startswith('//'):
                debug = any(c == 'DEBUG' or c.startswith('DEBUG') for c in stack)
                flag = 'URL?' if re.search(r'url|URL|absoluteString|secret|\blink\b|fragment', line) else ''
                print(f"{path}:{n}: inDEBUG={debug} stack={stack} {flag}\n    {s[:160]}")
