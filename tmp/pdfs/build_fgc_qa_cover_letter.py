from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

root = Path(__file__).resolve().parents[2]
output = root / 'output' / 'pdf' / 'Isaiah_Daniel_Palma_FGC_QA_Tester_Cover_Letter.pdf'
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
    Paragraph('Hiring Team<br/>FGC+', compact),
    Paragraph('Re: Quality Assurance Tester - Website and Mobile Application', subject),
    Paragraph('Dear FGC+ Hiring Team,', body),
    Paragraph('I’m applying for the Quality Assurance Tester position. I’m a Computer Science graduate from '
              'the University of St. La Salle with experience testing web and mobile applications through my '
              'backend internship and software projects.', body),
    Paragraph('At iReply Back Office Services, I worked with frontend developers to test features for an '
              'applicant tracking system, check that they met requirements, and troubleshoot issues before '
              'deployment. That experience taught me to trace unexpected behavior through the application and '
              'check how changes affect related workflows.', body),
    Paragraph('As the sole developer of a mobile wardrobe app, I used Android Studio and an emulator to check '
              'navigation, closet editing, and screen layouts. I also used Flutter unit and widget tests to '
              'check edge cases, including duplicate tags and missing images, and verify that screens stayed '
              'consistent after dark mode changes. I’m familiar with Figma and interested in applying that '
              'knowledge to checking builds against design specifications.', body),
    Paragraph('I’d welcome the opportunity to help FGC+ investigate defects, document clear steps to reproduce '
              'them, and verify fixes before release. Thank you for considering my application.', body),
    Paragraph('Sincerely,<br/>Isaiah Daniel Palma', compact),
]

output.parent.mkdir(parents=True, exist_ok=True)
SimpleDocTemplate(str(output), pagesize=letter, leftMargin=66, rightMargin=66, topMargin=60, bottomMargin=60,
                  title='Isaiah Daniel Palma - FGC+ QA Tester Cover Letter', author='Isaiah Daniel Palma').build(story)

pdf = PdfReader(output)
assert len(pdf.pages) == 1
print(pdf.pages[0].extract_text())
