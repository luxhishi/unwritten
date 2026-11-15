from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Flowable
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_Cruise_Control_Group_Resume.pdf'
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
p('Full Stack Engineer', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with backend internship experience supporting a Next.js applicant tracking system and full stack project experience with Django and PostgreSQL. Designed APIs and database schemas, built responsive Tailwind CSS interfaces, and worked with frontend developers to test and debug features.')

section('TECHNICAL SKILLS')
p('<b>Web development</b> | React, Tailwind CSS, TypeScript, Next.js, JavaScript, HTML, CSS<br/>'
  '<b>Backend and data</b> | Python, Django, PostgreSQL, Supabase, MySQL, REST API integration, JSON<br/>'
  '<b>Development tools</b> | Git, GitHub, Node.js tooling, Flutter unit and widget testing, debugging<br/>'
  '<b>AI-assisted development</b> | Claude Code, Codex, ChatGPT')

section('DEVELOPMENT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Helped build and maintain features for candidate, job, and application records in a Next.js applicant tracking system.')
bullet('Designed APIs and database schemas for recruitment workflows, with attention to requirements and data integrity.')
bullet('Worked with frontend developers to integrate backend features, test application behavior, and resolve issues before deployment.')

section('SELECTED PROJECTS')
heading('DevMax | Developer Discussion Platform', 'Academic project')
p('Python, Django, PostgreSQL, Tailwind CSS', 'meta')
bullet('Built responsive Tailwind CSS interfaces for discussion threads, comments, and voting, with Django handling application logic and PostgreSQL storing records.')
story.append(Spacer(1, 3))
heading('Stylex | Digital Wardrobe Mobile Application', 'Sole developer')
p('Flutter, Dart, Supabase, PostgreSQL', 'meta')
bullet('Built closet and outfit features backed by Supabase authentication and PostgreSQL, with SQL migrations and row-level access policies.')
bullet('Integrated the Open-Meteo REST API and processed JSON forecast data to inform outfit suggestions.')
bullet('Tested clothing tag normalization, outfit ranking, and screen appearance with Flutter unit and widget tests.')

section('ADDITIONAL EXPERIENCE')
heading('Race Data Coordinator', 'Selected events, 2024 - 2026')
p('Motorsports Development Program | Autocross Club of Bacolod', 'meta')
bullet('Verified race times and participant records and coordinated results reporting with event staff during live autocross events.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - Cruise Control Group Full Stack Engineer Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'cruise-control-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'cruise-control-{i + 1}.png')
print(text)
