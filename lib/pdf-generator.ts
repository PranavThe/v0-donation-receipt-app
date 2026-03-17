import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

// html2canvas crashes on CSS lab() colors (used by Tailwind v4 / shadcn CSS variables).
// Strategy: before capture, walk the cloned DOM and replace every style property
// whose computed or inline value contains "lab(" with a safe hex equivalent.
// We also temporarily patch CSSStyleDeclaration to swallow lab() during parsing.
function sanitizeClone(clone: HTMLElement) {
  // Replace any attribute/inline style that contains lab()
  const allEls = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))]

  allEls.forEach((el) => {
    // 1. Patch inline style attribute
    const attr = el.getAttribute("style")
    if (attr?.includes("lab(")) {
      el.setAttribute("style", attr.replace(/lab\([^)]*\)/g, "#888888"))
    }

    // 2. Patch every CSS property in the element's inline style object
    //    (html2canvas reads el.style directly, not computed styles)
    const s = el.style
    for (let i = 0; i < s.length; i++) {
      const prop = s[i]
      const val = s.getPropertyValue(prop)
      if (val.includes("lab(")) {
        s.setProperty(prop, val.replace(/lab\([^)]*\)/g, "#888888"))
      }
    }

    // 3. Force background to white on the root so nothing bleeds through
    if (el === clone) {
      el.style.backgroundColor = "#ffffff"
    }
  })
}

export async function generateReceiptPDF(
  receiptEl: HTMLElement,
  receiptNumber: string,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  // Temporarily override window.CSS.supports so html2canvas thinks
  // lab() is unsupported and falls back gracefully instead of crashing
  const originalSupports = window.CSS?.supports?.bind(window.CSS)
  if (window.CSS?.supports) {
    // @ts-ignore
    window.CSS.supports = (prop: string, val?: string) => {
      if (typeof prop === "string" && prop.includes("lab(")) return false
      if (typeof val === "string" && val.includes("lab(")) return false
      return originalSupports(prop, val as string)
    }
  }

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(receiptEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_doc, clonedEl) => {
        sanitizeClone(clonedEl)
      },
    })
  } finally {
    // Always restore original CSS.supports
    if (window.CSS?.supports && originalSupports) {
      // @ts-ignore
      window.CSS.supports = originalSupports
    }
  }

  const imgData = canvas.toDataURL("image/png")
  const pdfW = 612
  const pdfH = Math.round((canvas.height / canvas.width) * pdfW)

  const doc = new jsPDF({ unit: "pt", format: [pdfW, pdfH] })
  doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH)

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${receiptNumber}.pdf`)
}