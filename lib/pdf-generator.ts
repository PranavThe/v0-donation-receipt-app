import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export async function generateReceiptPDF(
  receiptEl: HTMLElement,
  receiptNumber: string,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  // Screenshot the exact rendered HTML at 2x scale for sharp print quality
  const canvas = await html2canvas(receiptEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  const imgData = canvas.toDataURL("image/png")
  const imgW = canvas.width
  const imgH = canvas.height

  // Letter width in points. Scale height to match aspect ratio.
  const pdfW = 612
  const pdfH = Math.round((imgH / imgW) * pdfW)

  const doc = new jsPDF({
    unit: "pt",
    format: [pdfW, pdfH],
  })

  doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH)

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${receiptNumber}.pdf`)
}