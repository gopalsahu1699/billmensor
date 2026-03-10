import { NextResponse } from 'next/server';

/**
 * PDF generation is now handled entirely client-side
 * via jsPDF + html-to-image in src/lib/pdf-service.ts.
 *
 * This route is kept as a stub to avoid 404s if any
 * old code still references /api/pdf.
 */
export async function POST() {
    return NextResponse.json(
        {
            error: 'Deprecated',
            details:
                'Server-side PDF generation has been replaced by client-side generation. Please update your code.',
        },
        { status: 410 }
    );
}
