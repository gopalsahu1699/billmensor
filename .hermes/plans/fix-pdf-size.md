# Reduce PDF file size in pdf-service.ts

File: C:\auto_billmensor\src\lib\pdf-service.ts

## Problem
PDF files are very large (several MB) because:
1. The element is captured as PNG at 2x pixel ratio (4x pixel count)
2. Each page slice is encoded as uncompressed PNG via `toDataURL("image/png")`
3. jsPDF embeds these as PNG images

## Solution
Switch from PNG to JPEG compression with quality 0.85, and reduce pixel ratio from 2 to 1.5.
JPEG at 85% quality is visually lossless for document/text content but 60-80% smaller.

### Change 1: Line 63 — Reduce pixel ratio from 2 to 1.5

Current:
```ts
const pixelRatio = 2;
```

Change to:
```ts
const pixelRatio = 1.5;
```

### Change 2: Line 64-72 — Add quality option to toPng call

Current:
```ts
const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "#ffffff",
    fontEmbedCSS: "",
    filter: (node: HTMLElement) => {
        return !node.classList?.contains("no-print");
    },
});
```

No change needed here — `toPng` always outputs PNG. We keep this as-is for the full-element capture (used for dimensions). The JPEG conversion happens at the slice level.

### Change 3: Line 115 — Change slice encoding from PNG to JPEG with quality

Current:
```ts
const sliceDataUrl = sliceCanvas.toDataURL("image/png");
```

Change to:
```ts
const sliceDataUrl = sliceCanvas.toDataURL("image/jpeg", 0.85);
```

### Change 4: Line 118-125 — Change jsPDF addImage format from PNG to JPEG

Current:
```ts
pdf.addImage(
    sliceDataUrl,
    "PNG",
    MARGIN_MM,
    MARGIN_MM,
    CONTENT_WIDTH_MM,
    sliceScaledHeight
);
```

Change to:
```ts
pdf.addImage(
    sliceDataUrl,
    "JPEG",
    MARGIN_MM,
    MARGIN_MM,
    CONTENT_WIDTH_MM,
    sliceScaledHeight
);
```

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
