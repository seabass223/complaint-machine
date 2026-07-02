import csv, sys, json, collections, re
from pathlib import Path

state_counts=collections.Counter()
product_counts=collections.Counter()
issue_counts=collections.Counter()
company_counts=collections.Counter()
state_products=collections.defaultdict(collections.Counter)
state_issues=collections.defaultdict(collections.Counter)
state_companies=collections.defaultdict(collections.Counter)
monthly=collections.Counter()
narratives=[]
rows=0
with_narr=0
reader=csv.DictReader(sys.stdin)
for row in reader:
    rows += 1
    st=(row.get('State') or '').strip()
    product=(row.get('Product') or 'Unknown').strip()
    issue=(row.get('Issue') or 'Unknown').strip()
    company=(row.get('Company') or 'Unknown').strip()
    date=(row.get('Date received') or '')[:7]
    narrative=(row.get('Consumer complaint narrative') or '').strip()
    if st and len(st)==2:
        state_counts[st]+=1
        state_products[st][product]+=1
        state_issues[st][issue]+=1
        state_companies[st][company]+=1
    product_counts[product]+=1
    issue_counts[issue]+=1
    company_counts[company]+=1
    if date:
        monthly[date]+=1
    if narrative:
        with_narr += 1
        # Keep only short-ish, already-public/redacted narratives for possible cards.
        clean=re.sub(r'\s+', ' ', narrative.replace('XXXX', '█'))
        if 80 <= len(clean) <= 500 and len(narratives)<60:
            narratives.append({
                'state': st,
                'product': product,
                'issue': issue,
                'company': company[:70],
                'text': clean[:480]
            })

funny_templates={
 'Credit reporting or other personal consumer reports':'The credit report goblin strikes again.',
 'Credit reporting, credit repair services, or other personal consumer reports':'The credit report goblin strikes again.',
 'Debt collection':'A debt collector entered the chat, aggressively.',
 'Credit card':'Plastic rectangle, emotional damage edition.',
 'Checking or savings account':'The bank account did bank account things.',
 'Mortgage':'Thirty years of paperwork, now with side quests.',
 'Money transfer, virtual currency, or money service':'The money moved. The customer service did not.',
 'Vehicle loan or lease':'The car came with a payment plot twist.',
 'Student loan':'A diploma, a portal login, and a headache walk into a bar.',
 'Payday loan, title loan, or personal loan':'Short-term cash, long-term vibes problem.',
}
state_data={}
for st,count in state_counts.items():
    top_product=state_products[st].most_common(1)[0][0]
    top_issue=state_issues[st].most_common(1)[0][0]
    top_company=state_companies[st].most_common(1)[0][0]
    state_data[st]={
        'count': count,
        'topProduct': top_product,
        'topIssue': top_issue,
        'topCompany': top_company,
        'caption': funny_templates.get(top_product, 'Another entry in the fine-print riot.'),
        'products': state_products[st].most_common(6),
        'issues': state_issues[st].most_common(5),
        'companies': state_companies[st].most_common(5)
    }

out={
 'meta': {
    'sampleRows': rows,
    'rowsWithNarratives': with_narr,
    'source': 'CFPB Consumer Complaint Database via Data.gov',
    'dataGov': 'https://catalog.data.gov/dataset/consumer-complaint-database',
    'cfpb': 'https://www.consumerfinance.gov/data-research/consumer-complaints/',
    'bulkCsvZip': 'https://files.consumerfinance.gov/ccdb/complaints.csv.zip',
    'note': 'Prototype uses the first 250k rows streamed from the public CFPB bulk CSV for fast static rendering.'
 },
 'states': state_data,
 'products': product_counts.most_common(12),
 'issues': issue_counts.most_common(12),
 'companies': company_counts.most_common(12),
 'monthly': sorted(monthly.items()),
 'narratives': narratives[:18]
}
Path('src').mkdir(exist_ok=True)
Path('src/data.js').write_text('window.COMPLAINT_DATA = '+json.dumps(out, ensure_ascii=False)+';\n', encoding='utf-8')
print(json.dumps(out['meta'], indent=2))
print('states', len(state_data), 'top products', out['products'][:3])
