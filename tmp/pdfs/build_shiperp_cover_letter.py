from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

root = Path(__file__).resolve().parents[2]
output = root / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_ShipERP_Cover_Letter.pdf'
fonts = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Calibri', str(fonts / 'calibri.ttf')))
pdfmetrics.registerFont(TTFont('Calibri-Bold', str(fonts / 'calibrib.ttf')))

ink = colors.HexColor('#17212b')
body = ParagraphStyle('Body', fontName='Calibri', fontSize=11.5, leading=16, textColor=ink, spaceAfter=12)
compact = ParagraphStyle('Compact', parent=body, leading=14, spaceAfter=0)
name = ParagraphStyle('Name', parent=compact, fontName='Calibri-Bold', fontSize=21, leading=25, spaceAfter=4)
subject = ParagraphStyle('Subject', parent=body, fontName='Calibri-Bold', spaceBefore=14, spaceAfter=14)

story = [
    Paragraph('Isaiah Daniel Palma', name),
    Paragraph('Bacolod City, Philippines<br/>(+63) 922 620 9815<br/>'
              '<link href="mailto:palmaisaiah.d@gmail.com" color="#17212b">palmaisaiah.d@gmail.com</link>', compact),
    Spacer(1, 18),
    Paragraph('November 15, 2026', body),
    Paragraph('Hiring Team<br/>ShipERP', compact),
    Paragraph('Re: Application for Junior Python Developer', subject),
    Paragraph('Dear ShipERP Hiring Team,', body),
    Paragraph('I’m applying for the Junior Python Developer position at ShipERP. I earned my Bachelor of '
              'Science in Computer Science from the University of St. La Salle and have used Python since '
              'college. For an academic project, I used Python and Django to build discussion threads, '
              'comments, and voting features backed by PostgreSQL.', body),
    Paragraph('During my backend internship at iReply Back Office Services, I designed APIs and database '
              'schemas for an applicant tracking system. I worked with frontend developers to clarify '
              'requirements, test features, and troubleshoot issues before deployment. I also use Git for '
              'version control and have used unit tests in my own projects to check that changes behave as expected.', body),
    Paragraph('I’d welcome the chance to contribute to ShipERP’s Python applications and APIs while learning '
              'from your senior developers. Thank you for considering my application. I’d be happy to discuss '
              'my experience in an interview.', body),
    Paragraph('Sincerely,<br/>Isaiah Daniel Palma', compact),
]

output.parent.mkdir(parents=True, exist_ok=True)
SimpleDocTemplate(str(output), pagesize=letter, leftMargin=66, rightMargin=66, topMargin=60, bottomMargin=60,
                  title='Isaiah Daniel Palma - ShipERP Cover Letter', author='Isaiah Daniel Palma').build(story)

pdf = PdfReader(output)
assert len(pdf.pages) == 1
print(pdf.pages[0].extract_text())
