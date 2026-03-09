const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    "src/app/dashboard/reports/pl-invoice/page.tsx",
    "src/app/dashboard/reports/sales-performance/page.tsx",
    "src/app/dashboard/reports/ca-audit/page.tsx",
    "src/app/dashboard/reports/stock-summary/page.tsx",
    "src/app/dashboard/reports/pl-stock/page.tsx",
    "src/app/dashboard/reports/party-ledgers/page.tsx",
    "src/app/dashboard/reports/gstr3b/page.tsx",
    "src/app/dashboard/reports/gstr1-json/page.tsx",
    "src/app/dashboard/reports/expenses/page.tsx",
];

const TEMPLATE = `
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
                    styles += \`<link rel="stylesheet" href="\${absoluteUrl}">\\n\`
                }
            } else {
                styles += node.outerHTML + '\\n'
            }
        })

        const htmlContent = \`
            <!DOCTYPE html>
            <html>
            <head>
                \${styles}
                <style>
                    body { background: white !important; margin: 0; padding: 20px; font-family: 'Inter', sans-serif; }
                    #report-content { box-shadow: none !important; border: none !important; margin: 0 auto !important; width: 1024px !important; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body class="bg-white">
                <div style="width: 1024px; max-width: 1024px; margin: 0 auto;">
                    \${element.outerHTML}
                </div>
            </body>
            </html>
        \`
        
        const filename = \`Report.pdf\`

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
                    title: \`Report\`,
                    text: \`Attached is the report.\`
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
`;

filesToUpdate.forEach(filepath => {
    const fullPath = path.join(process.cwd(), filepath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove any incorrectly placed id="report-content" from loading states first
    content = content.replace(/id="report-content"\s+className="([^"]*flex[^"]*)"/g, 'className="$1"');

    // 1. Provide a unique ID to the main reporting layout section
    // We look for the <div ...> that is NOT a loading state (doesn't contain "items-center" or "justify-center" usually)
    // Or we just find the first one after the final 'if (loading) return...' block
    const returnIndex = content.lastIndexOf('return (');
    if (returnIndex !== -1) {
        const afterReturn = content.substring(returnIndex);
        const updatedAfterReturn = afterReturn.replace(/<div\s+className="([^"]*)"/, (match, p1) => {
            if (p1.includes('report-content')) return match;
            return `<div id="report-content" className="${p1}"`;
        });
        content = content.substring(0, returnIndex) + updatedAfterReturn;
    }

    // 2. Replace empty handlePrint or window.print methods
    const patterns = [
        /const handlePrint = \(\) => {\s*window\.print\(\)\s*}/g,
        /const handlePrint = \(\) => window\.print\(\)/g,
        /async function handleShare\(\) {\s*window\.print\(\)\s*}/g,
        /const handleDownload = \(\) => {\s*window\.print\(\)\s*}/g
    ];

    patterns.forEach(pattern => {
        content = content.replace(pattern, TEMPLATE.trim());
    });

    // 3. Add IoShare to react-icons/io5 import if needed
    if (!content.includes('IoShare')) {
        content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-icons\/io5['"]/g, (match, p1) => {
            return `import {${p1}, IoShare} from "react-icons/io5"`;
        });
    }

    // 4. Handle edge cases like pl-stock or buttons mapped to handleShare
    if (content.includes('onClick={() => window.print()}')) {
        content = content.replace('onClick={() => window.print()}', 'onClick={handlePrint}');
    }

    // Ensure functions are there if buttons use them
    if ((content.includes('onClick={handlePrint}') || content.includes('onClick={handleShare}')) && !content.includes('generatePDFFile')) {
        content = content.replace(/(return\s*\()/, TEMPLATE + '\n\n    $1');
    }

    // 5. Share Button insertion dynamically next to Print/PDF Button
    const shareButton = `
                            <Button variant="outline" onClick={handleShare}>
                                <IoShare size={18} className="mr-2" /> Share
                            </Button>`;

    if (!content.includes('onClick={handleShare}')) {
        // Try to insert before the Print/PDF button
        const btnPattern = /<Button[^>]*onClick={(handlePrint|handleDownload)}[^>]*>[\s\S]*?<\/Button>/g;
        content = content.replace(btnPattern, (match) => {
            return shareButton.trim() + '\n                            ' + match;
        });
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filepath}`);
});

