from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Flowable
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_ShipERP_Resume.pdf'
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
p('Junior Python Developer', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate who has used Python since college, including to build a Django discussion platform backed by PostgreSQL. During a backend internship, designed APIs and database schemas and worked with frontend developers to test features and resolve issues before deployment.')

section('TECHNICAL SKILLS')
p('<b>Programming and web</b> | Python, Django, object-oriented programming, HTML5, CSS, JavaScript<br/>'
  '<b>APIs and databases</b> | API design, REST API integration, JSON, PostgreSQL, MySQL, Supabase<br/>'
  '<b>Development practices</b> | Git, GitHub, software testing, debugging, technical documentation')

section('PYTHON PROJECT')
heading('DevMax | Developer Discussion Platform', 'Academic year 2025 - 2026')
p('Python, Django, PostgreSQL, Tailwind CSS', 'meta')
bullet('Implemented discussion threads, comments, and voting in Python with Django, using PostgreSQL to store application data.')
bullet('Worked with Django models and views to connect database records and application logic to the web interface.')
bullet('The project includes automated Django tests for routing, sign-up, access checks, and post creation.')

section('DEVELOPMENT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Designed APIs and database schemas for a Next.js applicant tracking system that managed candidate, job, and application records.')
bullet('Worked with frontend developers to align backend features with requirements, test application behavior, and resolve issues before deployment.')

section('ADDITIONAL PROJECT')
heading('Stylex | Digital Wardrobe Mobile Application', 'Sole developer')
p('Flutter, Dart, Supabase, PostgreSQL', 'meta')
bullet('Integrated the Open-Meteo REST API and parsed JSON forecast data to inform outfit suggestions.')
bullet('Used Flutter unit and widget tests to check clothing tag normalization, outfit ranking, and screen appearance.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - ShipERP Junior Python Developer Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'shiperp-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'shiperp-{i + 1}.png')
print(text)
