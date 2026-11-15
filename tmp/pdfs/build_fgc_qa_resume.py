from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Flowable
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_FGC_QA_Tester_Resume.pdf'
FONT = Path('C:/Windows/Fonts')
for name, filename in [('Calibri', 'calibri.ttf'), ('Calibri-Bold', 'calibrib.ttf'), ('Calibri-Italic', 'calibrii.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT / filename)))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold', italic='Calibri-Italic', boldItalic='Calibri-Bold')

ink = colors.HexColor('#17212b')
styles = {
    'name': ParagraphStyle('Name', fontName='Calibri-Bold', fontSize=23, leading=26, textColor=colors.black, spaceAfter=3),
    'role': ParagraphStyle('Role', fontName='Calibri-Bold', fontSize=12, leading=15, textColor=ink, spaceAfter=3),
    'contact': ParagraphStyle('Contact', fontName='Calibri', fontSize=10.5, leading=13, textColor=ink, spaceAfter=9),
    'section': ParagraphStyle('Section', fontName='Calibri-Bold', fontSize=11, leading=14, textColor=ink, spaceBefore=9, spaceAfter=4, keepWithNext=True),
    'body': ParagraphStyle('Body', fontName='Calibri', fontSize=11, leading=13.3, textColor=ink, spaceAfter=3),
    'meta': ParagraphStyle('Meta', fontName='Calibri', fontSize=10.5, leading=12.5, textColor=ink, spaceAfter=3, keepWithNext=True),
    'bullet': ParagraphStyle('Bullet', fontName='Calibri', fontSize=11, leading=13.3, textColor=ink, leftIndent=10, firstLineIndent=-8, spaceAfter=2),
}

class EntryHeading(Flowable):
    def __init__(self, title, date):
        super().__init__()
        self.title, self.date = title, date
        self.height = 15
        self.keepWithNext = True
    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        return self.width, self.height
    def draw(self):
        self.canv.setFillColor(ink)
        self.canv.setFont('Calibri-Bold', 11)
        self.canv.drawString(0, 3, self.title)
        self.canv.setFont('Calibri', 10.5)
        self.canv.drawRightString(self.width, 3, self.date)

story = []
def p(text, style='body'):
    story.append(Paragraph(text, styles[style]))
def section(text):
    p(text, 'section')
def heading(title, date):
    story.append(EntryHeading(title, date))
def bullet(text):
    p('- ' + text, 'bullet')

p('Isaiah Daniel Palma', 'name')
p('QA Tester | Web and Mobile Applications', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with experience testing web and mobile applications through a backend internship and software projects. Checks user flows, visual consistency, and data handling using manual checks and automated tests. Collaborates with developers to troubleshoot issues and verify feature behavior.')

section('TECHNICAL SKILLS')
p('<b>Testing</b> | Functional testing, regression checks, UI validation, edge cases, debugging<br/>'
  '<b>Automation</b> | Flutter unit and widget tests<br/>'
  '<b>Web and data</b> | HTML, CSS, JavaScript, responsive layouts, REST APIs, JSON, PostgreSQL<br/>'
  '<b>Tools and documentation</b> | Android Studio, Android Emulator, Git, GitHub, technical documentation<br/>'
  '<b>Design tools</b> | Figma familiarity')

section('RELEVANT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Tested and refined features for a Next.js applicant tracking system, helping identify and resolve issues before deployment.')
bullet('Worked with frontend developers to align backend behavior with requirements for candidate, job, and application workflows.')
bullet('Designed APIs and database schemas with attention to data integrity across related records.')

section('SELECTED PROJECTS')
heading('Stylex | Digital Wardrobe Mobile Application', 'Sole developer')
p('Flutter, Dart, Android Studio, Supabase', 'meta')
bullet('Developed and checked closet workflows and mobile layouts using Android Studio and an Android emulator.')
bullet('Used Flutter widget tests to check onboarding and dark mode consistency, and unit tests to cover duplicate tags, outfit ranking, and closet image fallback behavior.')
heading('DevMax | Developer Discussion Platform', 'Academic year 2025 - 2026')
p('Python, Django, PostgreSQL, Tailwind CSS', 'meta')
bullet('Built responsive web interfaces for discussions, comments, and voting. The project includes automated tests for navigation, registration, access checks, and post creation.')

section('ADDITIONAL EXPERIENCE')
heading('Race Data Coordinator', 'Selected events, 2024 - 2026')
p('Motorsports Development Program | Autocross Club of Bacolod', 'meta')
bullet('Checked race times and participant records for missing information and discrepancies before results reporting.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - FGC+ QA Tester Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
assert len(reader.pages) == 1
print(text)
