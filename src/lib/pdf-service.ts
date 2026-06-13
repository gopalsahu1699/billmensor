import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

export interface PDFGenerationOptions {
    elementId: string;
    filename: string;
    title?: string;
    text?: string;
}

/**
 * Generates a high-quality PDF entirely on the client side.
 * Uses html-to-image to capture the element as a high-res PNG,
 * then embeds it into a jsPDF document with proper A4 sizing.
 */
export async function generateClientSidePDF({
    elementId,
    filename,
}: PDFGenerationOptions): Promise<File> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with ID "${elementId}" not found`);

    // 1. Calculate Page Height in Pixels
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const MARGIN_MM = 10;
    const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
    const PAGE_RATIO = (A4_HEIGHT_MM - (MARGIN_MM * 2)) / CONTENT_WIDTH_MM;
    
    const elementWidthPx = element.offsetWidth;
    const pageHeightPx = Math.floor(elementWidthPx * PAGE_RATIO);

    // 2. Insert Temporary Spacers
    // We insert them into the actual DOM to ensure styles/fonts are identical
    const breakAvoidElements = Array.from(element.querySelectorAll("tr, .break-inside-avoid"));
    const containerRect = element.getBoundingClientRect();
    const spacers: HTMLDivElement[] = [];

    try {
        // We iterate and check positions relative to the container
        breakAvoidElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const rect = htmlEl.getBoundingClientRect();
            const relativeTop = rect.top - containerRect.top;
            const height = rect.height;
            
            const pageOfTop = Math.floor(relativeTop / pageHeightPx);
            const pageOfBottom = Math.floor((relativeTop + height) / pageHeightPx);
            
            if (pageOfTop !== pageOfBottom && height < pageHeightPx) {
                const spaceOnCurrentPage = (pageOfTop + 1) * pageHeightPx - relativeTop;
                const spacer = document.createElement("div");
                spacer.style.height = `${spaceOnCurrentPage + 1}px`;
                spacer.className = "temp-pdf-spacer";
                spacer.style.width = "100%";
                htmlEl.parentNode?.insertBefore(spacer, htmlEl);
                spacers.push(spacer);
            }
        });

        // 3. Capture
        const pixelRatio = 1.5;
        const dataUrl = await toPng(element, {
            cacheBust: true,
            pixelRatio,
            backgroundColor: "#ffffff",
            fontEmbedCSS: "",
            filter: (node: HTMLElement) => {
                return !node.classList?.contains("no-print");
            },
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => reject(e);
            img.src = dataUrl;
        });

        const imgWidthPx = img.naturalWidth;
        const imgHeightPx = img.naturalHeight;
        const scaledHeightMM = (imgHeightPx * CONTENT_WIDTH_MM) / imgWidthPx;

        const pageContentHeightMM = A4_HEIGHT_MM - MARGIN_MM * 2;
        const totalPages = Math.ceil(scaledHeightMM / pageContentHeightMM);
        const pdf = new jsPDF("p", "mm", "a4");

        const canvas = document.createElement("canvas");
        canvas.width = imgWidthPx;
        canvas.height = imgHeightPx;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const sliceHeightPx = (pageContentHeightMM / scaledHeightMM) * imgHeightPx;

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();

            const sourceY = Math.round(page * sliceHeightPx);
            const sourceH = Math.min(Math.round(sliceHeightPx), imgHeightPx - sourceY);

            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = imgWidthPx;
            sliceCanvas.height = sourceH;
            const sliceCtx = sliceCanvas.getContext("2d")!;
            sliceCtx.fillStyle = "#ffffff";
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx.drawImage(
                canvas,
                0, sourceY, imgWidthPx, sourceH,
                0, 0, imgWidthPx, sourceH
            );

            const sliceDataUrl = sliceCanvas.toDataURL("image/jpeg", 0.85);
            const sliceScaledHeight = (sourceH * CONTENT_WIDTH_MM) / imgWidthPx;

            pdf.addImage(
                sliceDataUrl,
                "JPEG",
                MARGIN_MM,
                MARGIN_MM,
                CONTENT_WIDTH_MM,
                sliceScaledHeight
            );
        }

        const blob = pdf.output("blob");
        return new File([blob], filename, { type: "application/pdf" });
    } finally {
        // REMOVE SPACERS
        spacers.forEach(s => s.remove());
    }
}

/**
 * Handles the download of the generated PDF
 */
export async function downloadPDF(options: PDFGenerationOptions) {
    const toastId = toast.loading("Generating High-Quality PDF...");
    try {
        const file = await generateClientSidePDF(options);
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
        const file = await generateClientSidePDF(options);

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
