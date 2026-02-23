
export const downloadPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const { toPng } = await import('html-to-image');
        const { default: jsPDF } = await import('jspdf');

        // --- Scrollbar suppression ---
        // Save original styles
        const origBodyOverflow = document.body.style.overflow;
        const origElemOverflow = element.style.overflow;
        const origElemOverflowX = element.style.overflowX;

        // Hide scrollbars on the page and target element during capture
        document.body.style.overflow = 'hidden';
        element.style.overflow = 'visible';
        element.style.overflowX = 'visible';

        // Force re-layout so the element renders at its full natural width
        const naturalWidth = element.scrollWidth;
        const naturalHeight = element.scrollHeight;

        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            skipFonts: true,
            width: naturalWidth,
            height: naturalHeight,
            style: {
                margin: '0',
                overflow: 'visible',
                overflowX: 'visible',
            },
        });

        // Restore original styles
        document.body.style.overflow = origBodyOverflow;
        element.style.overflow = origElemOverflow;
        element.style.overflowX = origElemOverflowX;
        // --- End scrollbar suppression ---

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

export const getPDFBlob = async (elementId: string): Promise<Blob | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
        const { toPng } = await import('html-to-image');
        const { default: jsPDF } = await import('jspdf');

        // Suppress scrollbars during capture
        const origBodyOverflow = document.body.style.overflow;
        const origElemOverflow = element.style.overflow;
        const origElemOverflowX = element.style.overflowX;

        document.body.style.overflow = 'hidden';
        element.style.overflow = 'visible';
        element.style.overflowX = 'visible';

        const naturalWidth = element.scrollWidth;
        const naturalHeight = element.scrollHeight;

        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            skipFonts: true,
            width: naturalWidth,
            height: naturalHeight,
            style: {
                margin: '0',
                overflow: 'visible',
                overflowX: 'visible',
            },
        });

        // Restore original styles
        document.body.style.overflow = origBodyOverflow;
        element.style.overflow = origElemOverflow;
        element.style.overflowX = origElemOverflowX;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        return pdf.output('blob');
    } catch (error) {
        console.error('Error generating PDF blob:', error);
        throw error;
    }
};
