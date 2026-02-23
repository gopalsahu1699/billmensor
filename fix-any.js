import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replace catch (error: any) with catch (error: unknown)
    content = content.replace(/catch\s*\(\s*(error|_error)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');

    // Replace (error: any) =>
    content = content.replace(/\(\s*(error|_error)\s*:\s*any\s*\)\s*=>/g, '($1: unknown) =>');

    // Replace useState<any> with inference
    content = content.replace(/useState<any>\(null\)/g, 'useState<unknown | null>(null)');
    content = content.replace(/useState<any>/g, 'useState');

    // Replace common typed objects
    content = content.replace(/const statsMap: any = \{\}/g, 'const statsMap: Record<string, unknown> = {}');
    content = content.replace(/const categoryTotals: any = \{\}/g, 'const categoryTotals: Record<string, number> = {}');
    content = content.replace(/const hsnSummaryMap: any = \{\}/g, 'const hsnSummaryMap: Record<string, unknown> = {}');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
});

console.log('Modified files:', changedCount);
