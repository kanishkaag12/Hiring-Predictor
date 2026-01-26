from resume_parser import ResumeParser

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
p.sections = {}
p.segment_by_layout_and_rules()

print('\nSECTIONS:')
for k, v in p.sections.items():
    print(f'  {k}: "{v[:100]}..."')

print('\nEXTRACTED EDUCATION:')
education = p.extract_education()
for e in education:
    print(f'  {e}')
