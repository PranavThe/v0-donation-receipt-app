import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export async function generateReceiptPDF(
  receiptEl: HTMLElement,
  receiptNumber: string,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  // Capture the exact rendered HTML at 2× scale for sharp output
  const canvas = await html2canvas(receiptEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  const imgData = canvas.toDataURL("image/png")
  const imgWidth = canvas.width
  const imgHeight = canvas.height

  // Letter page in points (72pt = 1in)
  const PAGE_W = 612
  const PAGE_H = 792

  // Fit the captured image to page width, preserving aspect ratio
  const pdfW = PAGE_W
  const pdfH = (imgHeight / imgWidth) * pdfW

  // If the receipt is taller than one page, use the receipt's natural height
  const docH = Math.max(pdfH, PAGE_H)

  const doc = new jsPDF({
    unit: "pt",
    format: [PAGE_W, docH],
  })

  doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH)

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${receiptNumber}.pdf`)
}