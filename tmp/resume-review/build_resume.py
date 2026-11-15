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
OUT = ROOT / 'output' / 'resume' / 'Isaiah_Daniel_Palma_SU_Web_Developer_Resume.pdf'
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
p('Web Developer', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with hands-on experience in backend development, API design, database schemas, and software testing through an Applicant Tracking System internship and academic projects. Built a Django discussion platform with responsive Tailwind CSS interfaces. Experienced in collaborating with frontend developers to align backend functionality with application requirements.')

section('TECHNICAL SKILLS')
p('<b>Frontend:</b> HTML, CSS, JavaScript, Tailwind CSS; basic familiarity with React<br/>'
  '<b>Backend and data:</b> Python, Django, API design and development, PostgreSQL, Supabase, database design and data validation<br/>'
  '<b>Tools and practices:</b> Git, software testing, debugging, technical documentation<br/>'
  '<b>Mobile development:</b> Flutter, Dart, Android Studio')

section('DEVELOPMENT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Helped build and maintain Applicant Tracking System features for candidate, job, and application data.')
bullet('Designed APIs and database schemas with attention to data integrity, functionality, and reliable system performance.')
bullet('Collaborated with frontend teammates to align backend functionality with user-facing features and application requirements.')
bullet('Tested and refined features to identify and resolve development issues before deployment.')

section('SELECTED ACADEMIC PROJECTS')
heading('DevMax | Developer Discussion Platform', 'A.Y. 2025 - 2026')
p('Python, Django, Tailwind CSS', 'meta')
bullet('Developed a web platform with discussion threads, questions, updates, comments, and content voting.')
bullet('Implemented backend application logic and data handling in Django, with responsive interfaces built using Tailwind CSS.')
story.append(Spacer(1, 3))
heading('Stylex | Digital Wardrobe Mobile Application', 'A.Y. 2025 - 2026')
p('Flutter, Dart, Supabase', 'meta')
bullet('Built user-facing features for organizing clothing, generating outfit ideas, and monitoring wardrobe usage.')
bullet('Integrated Supabase for application data and backend functionality, with an interface focused on usability.')

section('ADDITIONAL EXPERIENCE')
heading('Vice President for External Affairs | Rektikano Esports League', 'Aug 2022 - Mar 2025')
bullet('Coordinated stakeholders and teams to support projects, events, and digital operations under tight timelines.')
heading('Race Data Coordinator | Autocross Club of Bacolod', 'Selected events, 2024 - 2026')
bullet('Maintained and verified race times and participant records, coordinating with event personnel for accurate results.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - Web Developer Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'resume-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'final-{i + 1}.png')
print(text)
