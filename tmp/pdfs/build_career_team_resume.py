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
OUT = ROOT / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_Career_TEAM_Resume.pdf'
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
p('Software Engineer', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with backend internship experience supporting a Next.js-based applicant tracking system. Project work spans TypeScript, React, Python, and PostgreSQL, with additional experience using MySQL. Experienced in API design, database schemas, troubleshooting, and collaboration across frontend and backend development.')

section('TECHNICAL SKILLS')
p('<b>Web development</b> | TypeScript, JavaScript, React, Next.js, HTML, CSS, Tailwind CSS<br/>'
  '<b>Backend and data</b> | Python, Django, PostgreSQL, MySQL, Supabase, API design and integration, JSON<br/>'
  '<b>Tools and practices</b> | Git, GitHub, Node.js build and test tooling, Android Studio, testing, debugging<br/>'
  '<b>AI-assisted development</b> | Codex, Claude')

section('DEVELOPMENT EXPERIENCE')
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Helped build and maintain candidate, job, and application features in a Next.js-based applicant tracking system.')
bullet('Designed APIs and database schemas with attention to data integrity and application requirements.')
bullet('Worked with frontend developers to integrate backend features and troubleshoot issues before deployment.')

section('SELECTED PROJECTS')
heading('DevMax | Developer Discussion Platform', 'Academic project')
p('Python, Django, PostgreSQL, Tailwind CSS', 'meta')
bullet('Built discussion threads, comments, and voting in Django, with PostgreSQL persistence and responsive Tailwind CSS interfaces.')
story.append(Spacer(1, 3))
heading('Stylex | Digital Wardrobe Mobile Application', 'Sole developer')
p('Flutter, Dart, Supabase, PostgreSQL', 'meta')
bullet('Integrated Supabase authentication and PostgreSQL persistence. Used SQL migrations for schema changes and user-scoped database access.')
bullet('Integrated the Open-Meteo API and parsed JSON forecast responses to inform outfit suggestions.')

section('LEADERSHIP EXPERIENCE')
heading('Vice President for External Affairs', 'Aug 2022 - Mar 2025')
p('Rektikano Esports League | Bacolod City', 'meta')
bullet('Coordinated stakeholders, events, and digital operations while managing the league\'s Facebook content.')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=43, leftMargin=43, topMargin=32, bottomMargin=32,
                        title='Isaiah Daniel Palma - Career TEAM Software Engineer Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'career-team-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'career-team-{i + 1}.png')
print(text)
