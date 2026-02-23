import sys

with open('src/app/[locale]/dashboard/point-of-sale/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

paren_open = content.count('(')
paren_close = content.count(')')
brace_open = content.count('{')
brace_close = content.count('}')
angle_open = content.count('<')
angle_close = content.count('>')

print(f"Parentheses: ( {paren_open}, ) {paren_close}, Diff: {paren_open - paren_close}")
print(f"Braces: {{ {brace_open}, }} {brace_close}, Diff: {brace_open - brace_close}")
print(f"Angle Brackets: < {angle_open}, > {angle_close}, Diff: {angle_open - angle_close}")

# Simple stack-based bracket checker to find the first imbalance
def check_balance(text):
    stack = []
    for i, char in enumerate(text):
        if char == '{':
            stack.append(('{', i))
        elif char == '}':
            if not stack:
                return f"Extra }} at index {i}"
            stack.pop()
    
    if stack:
        return f"Unclosed {{ at index {stack[-1][1]}"
    return "Balanced braces"

print(check_balance(content))
