/**
 * Utility to generate an Excel-compatible XML file (.xls)
 * This allows for professional spreadsheet exports without external dependencies.
 */
export function exportToExcel(data: any[], headers: string[], fileName: string) {
    const uri = 'data:application/vnd.ms-excel;base64,'
    const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>{worksheet}</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        </head>
        <body>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th style="background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold;">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>${row.map((cell: any) => `<td style="border: 1px solid #f1f5f9;">${cell ?? ''}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>`

    const format = (s: string, c: any) => s.replace(/{(\w+)}/g, (m, p) => c[p])
    const base64 = (s: string) => window.btoa(unescape(encodeURIComponent(s)))

    const context = {
        worksheet: 'Sheet 1',
        table: template
    }

    const link = document.createElement("a")
    link.href = uri + base64(format(template, context))
    link.download = fileName.endsWith('.xls') ? fileName : `${fileName}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
