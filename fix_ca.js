const fs = require('fs')
const file = 'src/app/dashboard/reports/ca-audit/page.tsx'
let content = fs.readFileSync(file, 'utf8')

// Add IoShare import
if (!content.includes('IoShare')) {
    content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-icons\/io5['"]/g, "import {$1, IoShare} from 'react-icons/io5'");
}

const replacementStr = `<Button
                        onClick={handleShare}
                        variant="outline"
                        className="flex items-center gap-2 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-sm transition-all text-slate-900 border-slate-300 hover:bg-slate-50"
                    >
                        <IoShare size={18} /> Share
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                    >
                        <IoMdDownload size={18} /> Export PDF for CA
                    </Button>`

content = content.replace(/<Button\s+onClick={handleShare}\s+className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900\/20 active:scale-95 transition-all"\s*>\s*<IoMdDownload size={18} \/> Export PDF for CA\s*<\/Button>/g, replacementStr)
fs.writeFileSync(file, content)
