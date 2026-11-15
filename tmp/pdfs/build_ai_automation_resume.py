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
OUT = ROOT / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_AI_Automations_Resume.pdf'
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
p('AI Automations Specialist', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with experience using AI coding tools, integrating APIs, testing application features, and maintaining accurate records. Sole developer of Stylex, with backend internship experience supporting an applicant tracking system. Brings Python and JavaScript skills, technical documentation, and stakeholder coordination to business workflow automation.')

section('TECHNICAL SKILLS')
p('<b>AI tools</b> | Claude Code, ChatGPT, Codex<br/>'
  '<b>Programming and integrations</b> | Python, JavaScript, TypeScript, REST API integration, JSON<br/>'
  '<b>Data and tools</b> | Google Workspace, PostgreSQL, MySQL, Supabase, Git, GitHub<br/>'
  '<b>Practices</b> | Testing, debugging, data validation, technical documentation, stakeholder coordination')

section('RELEVANT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Supported applicant tracking features for candidate, job, and application records within a system that included job-listing web scraping.')
bullet('Designed APIs and database schemas, then tested and refined features with attention to data integrity.')
bullet('Worked with frontend teammates to clarify application requirements and resolve development issues.')

story.append(Spacer(1, 3))
heading('Race Data Coordinator', 'Selected events, 2024 - 2026')
p('Motorsports Development Program | Autocross Club of Bacolod', 'meta')
bullet('Recorded race times and participant information, checked for errors and missing data, and coordinated accurate results reporting during live events.')

section('SELECTED PROJECTS')
heading('Stylex | Digital Wardrobe Mobile Application', 'Sole developer')
p('Flutter, Dart, Supabase, PostgreSQL', 'meta')
bullet('Integrated the Open-Meteo API, parsed JSON responses, and used forecast data to inform outfit suggestions.')
bullet('Built editable clothing records and connected the interface to authenticated Supabase data storage. Used AI coding tools to support development and iteration.')
story.append(Spacer(1, 3))
heading('DevMax | Developer Discussion Platform', 'Academic project')
p('Python, Django, PostgreSQL', 'meta')
bullet('Implemented discussion, commenting, and voting features, connecting backend application logic with user interactions and database records.')

section('LEADERSHIP EXPERIENCE')
heading('Vice President for External Affairs', 'Aug 2022 - Mar 2025')
p('Rektikano Esports League | Bacolod City', 'meta')
bullet('Coordinated stakeholders and project deadlines, scheduled Facebook posts, and oversaw event documentation.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - AI Automations Specialist Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'ai-automation-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'ai-automation-{i + 1}.png')
print(text)
