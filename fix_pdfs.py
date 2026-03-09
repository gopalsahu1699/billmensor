import os
import glob
import re

files_to_update = [
    "src/app/dashboard/reports/pl-invoice/page.tsx",
    "src/app/dashboard/reports/sales-performance/page.tsx",
    "src/app/dashboard/reports/ca-audit/page.tsx",
    "src/app/dashboard/reports/stock-summary/page.tsx",
    "src/app/dashboard/reports/pl-stock/page.tsx",
    "src/app/dashboard/reports/party-ledgers/page.tsx",
    "src/app/dashboard/reports/gstr3b/page.tsx",
    "src/app/dashboard/reports/gstr1-json/page.tsx",
    "src/app/dashboard/reports/expenses/page.tsx",
]

TEMPLATE = """
    const generatePDFFile = async (): Promise<File> => {
        const element = document.getElementById('report-content')
        if (!element) throw new Error('Report element not found')

        const styleNodes = document.querySelectorAll('style, link[rel="stylesheet"]')
        let styles = ''
        styleNodes.forEach((node) => {
            if (node.tagName === 'LINK') {
                const href = node.getAttribute('href')
                if (href) {
                    const absoluteUrl = new URL(href, window.location.href).href
                    styles += `<link rel="stylesheet" href="${absoluteUrl}">\\n`
                }
            } else {
                styles += node.outerHTML + '\\n'
            }
        })

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                ${styles}
                <style>
                    body { background: white !important; margin: 0; padding: 20px; font-family: 'Inter', sans-serif; }
                    #report-content { box-shadow: none !important; border: none !important; margin: 0 auto !important; width: 1024px !important; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body class="bg-white">
                <div style="width: 1024px; max-width: 1024px; margin: 0 auto;">
                    ${element.outerHTML}
                </div>
            </body>
            </html>
        `
        
        const filename = `Report.pdf`

        const response = await fetch('/api/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: htmlContent, filename })
        })

        if (!response.ok) throw new Error('Server PDF Failed')

        const blob = await response.blob()
        return new File([blob], filename, { type: 'application/pdf' })
    }

    const handleShare = async () => {
        toast.loading('Preparing PDF to share...', { id: 'pdf-share' })
        try {
            const file = await generatePDFFile()
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                toast.dismiss('pdf-share')
                await navigator.share({
                    files: [file],
                    title: `Report`,
                    text: `Attached is the report.`
                })
            } else {
                toast.error('Sharing files is not supported on this device.', { id: 'pdf-share' })
            }
        } catch (error) {
            console.error('Share failed', error)
            toast.error('Failed to share PDF.', { id: 'pdf-share' })
        }
    }

    const handlePrint = async () => {
        toast.loading('Generating Perfect Web PDF...', { id: 'pdf-generation' })
        try {
            const file = await generatePDFFile()
            const url = window.URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            a.click()
            window.URL.revokeObjectURL(url)
            toast.success('PDF Downloaded!', { id: 'pdf-generation' })
        } catch (error) {
            console.error(error)
            toast.error('Failed using Server PDF.', { id: 'pdf-generation' })
        }
    }
"""

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Provide a unique ID to the main reporting layout section
    content = re.sub(r'return\s*\(\s*<div\s+className="([^"]*)"', r'return (\n        <div id="report-content" className="\1"', content, count=1)
    
    # 2. Replace empty handlePrint
    content = re.sub(r'const handlePrint = \(\) => {\s*window\.print\(\)\s*}', TEMPLATE.strip(), content)
    content = re.sub(r'const handlePrint = \(\) => window\.print\(\)', TEMPLATE.strip(), content)

    # 3. Add IoShare to react-icons import if needed
    if 'IoShare' not in content:
        content = re.sub(r'import\s+{([^}]*)}\s+from\s+[\'"]react-icons/io5[\'"]', r'import {\1, IoShare} from "react-icons/io5"', content)

    # 4. Handle edge cases like pl-stock
    if 'onClick={() => window.print()}' in content:
        content = content.replace('onClick={() => window.print()}', 'onClick={handlePrint}')
        if 'generatePDFFile' not in content:
            content = re.sub(r'(return\s*\()', TEMPLATE + r'\n\n    \1', content, count=1)

    # 5. Share Button insertion dynamically next to Print Button
    share_button = """
                            <Button variant="outline" onClick={handleShare}>
                                <IoShare size={18} className="mr-2" /> Share
                            </Button>"""

    # We can gently insert this if not present
    if '<IoShare' not in content:
        # Match where <Button ... onClick={handlePrint} > is to place Share before it
        content = re.sub(r'(<Button[^>]*onClick={handlePrint}[^>]*>[\s\S]*?</Button>)', share_button.strip() + r'\n                            \1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")
