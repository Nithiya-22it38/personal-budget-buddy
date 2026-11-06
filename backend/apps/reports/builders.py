from io import BytesIO
from xml.sax.saxutils import escape

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

STATUS_NAMES = {
    'ok': 'On track',
    'warning': 'Warning',
    'over': 'Over limit',
}


def money(value):
    return 'Rs. ' + f'{value:.2f}'


# ---------------- PDF ----------------

def add_table_section(story, styles, heading, header, rows, widths, empty_text):
    story.append(Spacer(1, 14))
    story.append(Paragraph(heading, styles['Heading2']))

    if len(rows) == 0:
        story.append(Paragraph(empty_text, styles['Normal']))
        return

    table = Table([header] + rows, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
    ]))
    story.append(table)


def build_pdf(summary):
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, title='BudgetBuddy report')
    styles = getSampleStyleSheet()
    story = []

    title_line = summary['month_name'] + ' ' + str(summary['year']) + ' - ' + escape(summary['username'])
    story.append(Paragraph('BudgetBuddy Monthly Report', styles['Title']))
    story.append(Paragraph(title_line, styles['Normal']))

    # summary numbers
    summary_rows = [
        ['Total income', money(summary['income_total'])],
        ['Total expenses', money(summary['expense_total'])],
        ['Balance', money(summary['balance'])],
        ['Saved toward goals', money(summary['saved_total'])],
    ]
    add_table_section(
        story, styles, 'Summary', ['Item', 'Amount'], summary_rows,
        [90 * mm, 65 * mm], '',
    )

    # spending by category
    category_rows = []
    for item in summary['by_category']:
        category_rows.append([item['name'], money(item['amount']), str(item['percent']) + '%'])
    add_table_section(
        story, styles, 'Spending by category', ['Category', 'Amount', 'Share'], category_rows,
        [70 * mm, 45 * mm, 40 * mm], 'No expenses this month.',
    )

    # budgets
    budget_rows = []
    for item in summary['budgets']:
        budget_rows.append([
            item['category_name'],
            money(item['limit_amount']),
            money(item['spent']),
            str(item['percent_used']) + '%',
            STATUS_NAMES[item['status']],
        ])
    add_table_section(
        story, styles, 'Budgets',
        ['Budget', 'Limit', 'Spent', 'Used', 'Status'], budget_rows,
        [45 * mm, 30 * mm, 30 * mm, 22 * mm, 28 * mm], 'No budgets set for this month.',
    )

    # expenses
    expense_rows = []
    for item in summary['expenses']:
        expense_rows.append([item['date'], item['category'], item['note'][:30], money(item['amount'])])
    add_table_section(
        story, styles, 'Expenses', ['Date', 'Category', 'Note', 'Amount'], expense_rows,
        [28 * mm, 40 * mm, 55 * mm, 32 * mm], 'No expenses this month.',
    )

    # income
    income_rows = []
    for item in summary['incomes']:
        income_rows.append([item['date'], item['source'], item['note'][:30], money(item['amount'])])
    add_table_section(
        story, styles, 'Income', ['Date', 'Source', 'Note', 'Amount'], income_rows,
        [28 * mm, 40 * mm, 55 * mm, 32 * mm], 'No income this month.',
    )

    # money added to goals
    saving_rows = []
    for item in summary['savings']:
        saving_rows.append([item['date'], item['goal'][:40], money(item['amount'])])
    add_table_section(
        story, styles, 'Money added to savings goals', ['Date', 'Goal', 'Amount'], saving_rows,
        [30 * mm, 80 * mm, 45 * mm], 'No money added to goals this month.',
    )

    document.build(story)
    return buffer.getvalue()


# ---------------- Excel ----------------

def make_sheet(workbook, title, header, widths):
    sheet = workbook.create_sheet(title)
    sheet.append(header)

    for cell in sheet[1]:
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', start_color='4F46E5')

    letters = ['A', 'B', 'C', 'D', 'E']
    for i in range(len(widths)):
        sheet.column_dimensions[letters[i]].width = widths[i]

    return sheet


def money_format(sheet, column_letter):
    for cell in sheet[column_letter][1:]:
        cell.number_format = '#,##0.00'


def build_excel(summary):
    workbook = Workbook()
    workbook.remove(workbook.active)

    # sheet 1: summary
    sheet = make_sheet(workbook, 'Summary', ['Item', 'Value'], [24, 22])
    sheet.append(['User', summary['username']])
    sheet.append(['Month', summary['month_name'] + ' ' + str(summary['year'])])
    sheet.append(['Total income (Rs.)', summary['income_total']])
    sheet.append(['Total expenses (Rs.)', summary['expense_total']])
    sheet.append(['Balance (Rs.)', summary['balance']])
    sheet.append(['Saved toward goals (Rs.)', summary['saved_total']])
    for row_number in range(4, 8):
        sheet.cell(row=row_number, column=2).number_format = '#,##0.00'

    # sheet 2: spending by category
    sheet = make_sheet(workbook, 'By category', ['Category', 'Amount (Rs.)', 'Share (%)'], [24, 18, 14])
    for item in summary['by_category']:
        sheet.append([item['name'], item['amount'], item['percent']])
    money_format(sheet, 'B')

    # sheet 3: budgets
    sheet = make_sheet(
        workbook, 'Budgets',
        ['Budget', 'Limit (Rs.)', 'Spent (Rs.)', 'Used (%)', 'Status'], [24, 16, 16, 12, 14],
    )
    for item in summary['budgets']:
        sheet.append([
            item['category_name'], item['limit_amount'], item['spent'],
            item['percent_used'], STATUS_NAMES[item['status']],
        ])
    money_format(sheet, 'B')
    money_format(sheet, 'C')

    # sheet 4: expenses
    sheet = make_sheet(workbook, 'Expenses', ['Date', 'Category', 'Note', 'Amount (Rs.)'], [14, 20, 36, 16])
    for item in summary['expenses']:
        sheet.append([item['date'], item['category'], item['note'], item['amount']])
    money_format(sheet, 'D')

    # sheet 5: income
    sheet = make_sheet(workbook, 'Income', ['Date', 'Source', 'Note', 'Amount (Rs.)'], [14, 20, 36, 16])
    for item in summary['incomes']:
        sheet.append([item['date'], item['source'], item['note'], item['amount']])
    money_format(sheet, 'D')

    # sheet 6: money added to goals
    sheet = make_sheet(workbook, 'Savings', ['Date', 'Goal', 'Amount (Rs.)'], [14, 30, 16])
    for item in summary['savings']:
        sheet.append([item['date'], item['goal'], item['amount']])
    money_format(sheet, 'C')

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()