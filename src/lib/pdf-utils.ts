
export const downloadPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // Dynamically import libraries to reduce initial bundle size
        const { toPng } = await import('html-to-image');
        const { default: jsPDF } = await import('jspdf');

        // html-to-image handles modern CSS (like oklch) much better than html2canvas
        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            skipFonts: true, // Fixes SecurityError: Failed to read 'cssRules' from 'CSSStyleSheet'
            style: { margin: '0' },
        });

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

        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            skipFonts: true,
            style: { margin: '0' },
        });

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
