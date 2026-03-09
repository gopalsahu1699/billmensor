import { toast } from "sonner";

export interface PDFGenerationOptions {
    elementId: string;
    filename: string;
    title?: string;
    text?: string;
}

/**
 * Captures an HTML element and its styles, sends it to the server-side 
 * Puppeteer service, and returns a File object (PDF).
 */
export async function generateServerSidePDF({
    elementId,
    filename,
}: PDFGenerationOptions): Promise<File> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with ID "${elementId}" not found`);

    // Gather all style tags and linked stylesheets
    const styleNodes = document.querySelectorAll('style, link[rel="stylesheet"]');
    let styles = "";
    styleNodes.forEach((node) => {
        if (node.tagName === "LINK") {
            const href = node.getAttribute("href");
            if (href) {
                const absoluteUrl = new URL(href, window.location.href).href;
                styles += `<link rel="stylesheet" href="${absoluteUrl}">\n`;
            }
        } else {
            styles += node.outerHTML + "\n";
        }
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${styles}
            <style>
                body { 
                    background: white !important; 
                    margin: 0; 
                    padding: 40px; 
                    font-family: 'Inter', sans-serif; 
                }
                #${elementId} { 
                    box-shadow: none !important; 
                    border: none !important; 
                    margin: 0 auto !important; 
                    width: 100% !important;
                    max-width: 1024px !important;
                }
                .no-print { display: none !important; }
                /* Ensure background colors and images are printed */
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
        </head>
        <body class="bg-white">
            <div style="width: 100%; max-width: 1024px; margin: 0 auto;">
                ${element.outerHTML}
            </div>
        </body>
        </html>
    `;

    const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent, filename }),
    });

    if (!response.ok) throw new Error("Server-side PDF generation failed");

    const blob = await response.blob();
    return new File([blob], filename, { type: "application/pdf" });
}

/**
 * Handles the download of the generated PDF
 */
export async function downloadPDF(options: PDFGenerationOptions) {
    const toastId = toast.loading("Generating High-Quality PDF...");
    try {
        const file = await generateServerSidePDF(options);
        const url = window.URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("PDF Downloaded!", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    }
}

/**
 * Handles sharing the generated PDF via the Web Share API
 */
export async function sharePDF(options: PDFGenerationOptions) {
    const toastId = toast.loading("Preparing PDF for sharing...");
    try {
        const file = await generateServerSidePDF(options);

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: options.title || "Document",
                text: options.text || "Please find the attached document.",
            });
            toast.dismiss(toastId);
        } else {
            toast.error("File sharing is not supported on this device/browser.", { id: toastId });
        }
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            toast.dismiss(toastId);
            return;
        }
        console.error("Sharing failed", error);
        toast.error("Failed to share PDF.", { id: toastId });
    }
}
