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
OUT = ROOT / 'output' / 'resume' / 'Isaiah_Daniel_Palma_Expounder_Resume.pdf'
FONT = Path('C:/Windows/Fonts')
for name, filename in [('Calibri', 'calibri.ttf'), ('Calibri-Bold', 'calibrib.ttf'), ('Calibri-Italic', 'calibrii.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT / filename)))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold', italic='Calibri-Italic', boldItalic='Calibri-Bold')

ink = colors.HexColor('#17212b')
styles = {
    'name': ParagraphStyle('Name', fontName='Calibri-Bold', fontSize=23, leading=26, textColor=colors.black, spaceAfter=3),
    'role': ParagraphStyle('Role', fontName='Calibri-Bold', fontSize=12, leading=15, textColor=ink, spaceAfter=3),
    'contact': ParagraphStyle('Contact', fontName='Calibri', fontSize=10.5, leading=13, textColor=ink, spaceAfter=3),
    'section': ParagraphStyle('Section', fontName='Calibri-Bold', fontSize=11, leading=14, textColor=ink, spaceBefore=13, spaceAfter=5, keepWithNext=True),
    'body': ParagraphStyle('Body', fontName='Calibri', fontSize=11, leading=14.5, textColor=ink, spaceAfter=3),
    'meta': ParagraphStyle('Meta', fontName='Calibri', fontSize=10.5, leading=12.5, textColor=ink, spaceAfter=3, keepWithNext=True),
    'bullet': ParagraphStyle('Bullet', fontName='Calibri', fontSize=11, leading=14.5, textColor=ink, leftIndent=10, firstLineIndent=-8, spaceAfter=4),
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
p('Social Media and Operations Support', 'role')
p('Bacolod City, Philippines | (+63) 922 620 9815 | <link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', 'contact')

section('SUMMARY')
p('Computer Science graduate with experience managing Facebook content, designing graphics, coordinating stakeholders, and maintaining accurate records. Uses Photoshop, Canva, and Google Workspace. Internship experience includes supporting an applicant tracking system for candidate, job, and application records.')

section('RELEVANT EXPERIENCE')
heading('Vice President for External Affairs', 'Aug 2022 - Mar 2025')
p('Rektikano Esports League | Bacolod City', 'meta')
bullet('Managed the league\'s Facebook page and scheduled posts.')
bullet('Designed graphics for league content and oversaw event documentation.')
bullet('Coordinated with internal and external stakeholders to support events, projects, and digital operations under tight timelines.')

story.append(Spacer(1, 7))
heading('Race Data Coordinator', 'Selected events, 2024 - 2026')
p('Motorsports Development Program | Autocross Club of Bacolod', 'meta')
bullet('Recorded and updated race times and participant records during live motorsports events.')
bullet('Checked records for errors, missing information, and inconsistencies, then worked with event personnel to report accurate results.')

story.append(Spacer(1, 7))
heading('Backend Developer Intern', 'Jul 2025 - Nov 2025')
p('iReply Back Office Services | Bacolod City', 'meta')
bullet('Supported an Applicant Tracking System by helping build and maintain features for candidate, job, and application records.')
bullet('Designed database schemas with attention to data integrity and tested application features to identify issues before deployment.')
bullet('Worked with frontend teammates to align application features with requirements and resolve development issues.')

section('SKILLS')
p('<b>Social media and design</b> | Facebook, post scheduling, graphic design, Adobe Photoshop, Canva<br/>'
  '<b>Operations</b> | Stakeholder coordination, event documentation, data entry and verification, results reporting<br/>'
  '<b>Tools</b> | Google Workspace (Docs and Sheets), applicant tracking systems, database fundamentals')

section('EDUCATION')
heading('Bachelor of Science in Computer Science', 'Apr 2026')
p('University of St. La Salle | Bacolod City, Negros Occidental')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=48, leftMargin=48, topMargin=43, bottomMargin=43,
                        title='Isaiah Daniel Palma - Expounder Resume', author='Isaiah Daniel Palma')
doc.build(story)
reader = PdfReader(OUT)
print('Output:', OUT)
print('Pages:', len(reader.pages))
text = '\n'.join(page.extract_text() for page in reader.pages)
(Path(__file__).parent / 'expounder-extracted.txt').write_text(text, encoding='utf-8')
pdf = pdfium.PdfDocument(str(OUT))
for i, page in enumerate(pdf):
    page.render(scale=1.7).to_pil().save(Path(__file__).parent / f'expounder-{i + 1}.png')
print(text)
