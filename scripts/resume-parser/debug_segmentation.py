from resume_parser import ResumeParser
import re

text = """
        Education:
        Bachelor of Science in Computer Science
        Stanford University, 2020
        
        Master of Science in Machine Learning
        MIT, 2022
        """

lines = [line.strip() for line in text.split('\n') if line.strip()]
print('LINES:')
for i, line in enumerate(lines):
    print(f'  {i}: "{line}"')

p = ResumeParser.__new__(ResumeParser)
p.text = text
p.lines = lines

# MANUAL SEGMENTATION WITH DEBUG
sections = {}
current_section = 'header'
section_text = []
i = 0

while i < len(lines):
    line = lines[i]
    line_lower = line.lower().strip()
    is_section_header = False
    
    print(f'\n--- i={i}, line="{line}"')
    print(f'    current_section={current_section}, section_text has {len(section_text)} lines')
    
    # Check separator patterns
    if re.match(r'^[=\-—_*\s]+$', line) and i + 1 < len(lines):
        print('    Checking separator pattern...')
        # ... (skipping this for now)
    
    if not is_section_header:
        # Check section keywords
        best_match = None
        best_match_length = 0
        
        for section_name, keywords in p.SECTION_KEYWORDS.items():
            for kw in keywords:
                if kw in line_lower:
                    if len(line.strip()) < 100 and (line.strip().endswith(':') or len(line.split()) <= 5):
                        if len(kw) > best_match_length:
                            print(f'      Matched "{kw}" for section "{section_name}"')
                            best_match = section_name
                            best_match_length = len(kw)
        
        if best_match:
            print(f'    => SECTION HEADER FOUND: {best_match}')
            if current_section:
                sections[current_section] = '\n'.join(section_text)
                print(f'       Saved section "{current_section}" with {len(section_text)} lines')
            
            current_section = best_match
            section_text = [line]
            print(f'       Started new section "{current_section}", section_text=["{line}"]')
            is_section_header = True
    
    if not is_section_header:
        print(f'    => REGULAR LINE, appending to section_text')
        section_text.append(line)
    
    i += 1

# Save last section
if current_section and section_text:
    sections[current_section] = '\n'.join(section_text)
    print(f'\nSaved final section "{current_section}" with {len(section_text)} lines')

print('\n\nFINAL SECTIONS:')
for k, v in sections.items():
    print(f'  {k}: {len(v.split(chr(10)))} lines')
    for line_num, line_content in enumerate(v.split('\n')[:3]):
        print(f'     {line_num}: "{line_content}"')
