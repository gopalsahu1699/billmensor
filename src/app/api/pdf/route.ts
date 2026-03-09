import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
    try {
        const { html, filename } = await req.json();

        // Launch a headless Chromium instance
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Ensure crisp rendering and emulate desktop screen
        await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
        await page.emulateMediaType('screen'); // Bypasses print media queries

        // Load the provided HTML
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for Inter and other fonts to load
        await page.evaluateHandle('document.fonts.ready');

        // Generate the PDF
        // Scaling ensures the 1000px+ desktop layout correctly fits into standard A4 width
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            scale: 0.7, // Fits wide desktop layouts
            margin: { top: '10mm', bottom: '10mm', left: '5mm', right: '5mm' }
        });

        await browser.close();

        // Return the PDF buffer as a file download
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename || 'Document.pdf'}"`
            }
        });

    } catch (error) {
        console.error('Puppeteer PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
