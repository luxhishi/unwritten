from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Flowable
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'resume' / 'Isaiah_Daniel_Palma_AltitudeIQ_Backend_Engineer_Resume.pdf'
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
p('Backend Software Engineer', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with backend internship experience in API design, database schemas, application features, and software testing. Built academic applications using Python, Django, Flutter, and Supabase. Learns new technologies quickly and communicates clearly across teams. Seeking to contribute to AltitudeIQ while developing deeper expertise in backend systems and AI agent engineering.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

section('TECHNICAL SKILLS')
p('<b>Backend:</b> Python, Django, API design and development, application logic<br/>'
  '<b>Data:</b> PostgreSQL, Supabase, database design, data handling and validation<br/>'
  '<b>Engineering practices:</b> Git, software testing, debugging, technical documentation<br/>'
  '<b>Additional development:</b> Flutter, Dart, HTML, CSS, JavaScript, Tailwind CSS, Unity')

section('DEVELOPMENT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Helped build and maintain Applicant Tracking System features for candidate, job, and application data.')
bullet('Designed APIs and database schemas with attention to data integrity, functionality, and reliable system performance.')
bullet('Collaborated with frontend teammates to align backend functionality with user-facing features and application requirements.')
bullet('Tested and refined features to identify development issues and improve system consistency and usability before deployment.')

section('SELECTED ACADEMIC PROJECTS')
heading('DevMax | Developer Discussion Platform', 'A.Y. 2025 - 2026')
p('Python, Django, Tailwind CSS', 'meta')
bullet('Developed a web platform with discussion threads, questions, updates, comments, and content voting.')
bullet('Implemented backend application logic, user interactions, and data handling using Django, with responsive Tailwind CSS interfaces.')
story.append(Spacer(1, 3))
heading('Stylex | Digital Wardrobe Mobile Application', 'A.Y. 2025 - 2026')
p('Flutter, Dart, Supabase', 'meta')
bullet('Built user-facing features for organizing clothing, generating outfit ideas, and monitoring wardrobe usage.')
bullet('Integrated Supabase for application data and backend functionality, with an interface focused on usability.')
story.append(Spacer(1, 3))
heading('SafetyFirst VR | Safety Training Application', 'A.Y. 2025 - 2026')
p('Unity, Meta VR, Voice Recognition', 'meta')
bullet('Developed interactive virtual reality scenarios for practicing responses to fire, earthquakes, and other emergency hazards.')
bullet('Integrated voice recognition so users could interact with the application through spoken commands and responses.')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - AltitudeIQ Backend Software Engineer Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'altitudeiq-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'altitudeiq-{i + 1}.png')
print(text)
