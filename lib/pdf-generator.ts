import { jsPDF } from "jspdf"
import { format } from "date-fns"

interface ReceiptData {
  receiptNumber: string
  donorName: string
  donorEmail: string
  donorAddress?: string
  donationAmount: number
  donationDate: Date
  paymentMethod: string
  note?: string
  orgInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    ein: string
    representative: string
    title: string
  }
}

export function generateReceiptPDF(data: ReceiptData, options?: { returnBase64?: boolean }): string | void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 25

  // Header - Organization Name
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(139, 119, 42) // Muted gold color
  doc.text(data.orgInfo.name, pageWidth / 2, y, { align: "center" })
  y += 10

  // Organization details
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(data.orgInfo.address, pageWidth / 2, y, { align: "center" })
  y += 5
  doc.text(`Phone: ${data.orgInfo.phone} | Email: ${data.orgInfo.email}`, pageWidth / 2, y, { align: "center" })
  y += 5
  doc.text(`Website: ${data.orgInfo.website}`, pageWidth / 2, y, { align: "center" })
  y += 5
  doc.text("501(c)(3) Tax-Exempt Organization | EIN: " + data.orgInfo.ein, pageWidth / 2, y, { align: "center" })
  y += 12

  // Divider line
  doc.setDrawColor(200, 180, 120)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 15

  // Receipt Title
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(60, 60, 60)
  doc.text("DONATION RECEIPT", pageWidth / 2, y, { align: "center" })
  y += 12

  // Receipt Number
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Receipt No: ${data.receiptNumber}`, pageWidth / 2, y, { align: "center" })
  y += 5
  doc.text(`Date Issued: ${format(new Date(), "MMMM d, yyyy")}`, pageWidth / 2, y, { align: "center" })
  y += 15

  // Donor Information Box
  doc.setFillColor(250, 248, 240)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, "F")
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(60, 60, 60)
  doc.text("DONOR INFORMATION", margin + 5, y)
  y += 7

  doc.setFont("helvetica", "normal")
  doc.text(`Name: ${data.donorName}`, margin + 5, y)
  y += 5
  doc.text(`Email: ${data.donorEmail}`, margin + 5, y)
  if (data.donorAddress) {
    y += 5
    doc.text(`Address: ${data.donorAddress}`, margin + 5, y)
  }
  y += 20

  // Donation Details Box
  doc.setFillColor(250, 248, 240)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 45, 3, 3, "F")
  y += 8

  doc.setFont("helvetica", "bold")
  doc.text("DONATION DETAILS", margin + 5, y)
  y += 10

  doc.setFont("helvetica", "normal")
  
  // Amount in larger text
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(139, 119, 42)
  doc.text(`$${data.donationAmount.toFixed(2)} USD`, margin + 5, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(60, 60, 60)
  doc.text(`Date of Donation: ${format(data.donationDate, "MMMM d, yyyy")}`, margin + 5, y)
  y += 5
  doc.text(`Payment Method: ${data.paymentMethod}`, margin + 5, y)
  if (data.note) {
    y += 5
    doc.text(`Purpose: ${data.note}`, margin + 5, y)
  }
  y += 20

  // Tax Deductibility Statement
  doc.setFillColor(245, 243, 235)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, "F")
  y += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(80, 80, 80)
  const taxStatement = "No goods or services were provided in exchange for this contribution. This letter serves as your official receipt for tax purposes."
  const splitText = doc.splitTextToSize(taxStatement, pageWidth - margin * 2 - 10)
  doc.text(splitText, margin + 5, y)
  y += 25

  // Signature Section
  y += 10
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(60, 60, 60)
  doc.text("With gratitude,", margin, y)
  y += 15

  // Signature line
  doc.setDrawColor(100, 100, 100)
  doc.line(margin, y, margin + 60, y)
  y += 5

  doc.setFont("helvetica", "bold")
  doc.text(data.orgInfo.representative, margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.text(data.orgInfo.title, margin, y)
  y += 5
  doc.text(data.orgInfo.name, margin, y)

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "Thank you for your generous support of the Vedanta Society of Providence.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  )

  // Return base64 or save the PDF
  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${data.receiptNumber}.pdf`)
}
