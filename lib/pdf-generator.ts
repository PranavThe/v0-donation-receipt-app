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

const DARK_RED = [139, 26, 26] as const
const MID_GRAY = [68, 68, 68] as const
const LT_GRAY = [136, 136, 136] as const
const ROW_BG = [253, 246, 236] as const
const GOLD_LINE = [224, 200, 160] as const
const WHITE = [255, 255, 255] as const
const BLACK = [0, 0, 0] as const

// Fetch the logo, draw it onto a white canvas, return as PNG base64.
// This flattens transparency so jsPDF doesn't render a black background.
async function fetchLogoBase64(): Promise<string | undefined> {
  try {
    const res = await fetch("/logo_no_bg2.webp")
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)

    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(objectUrl)
        resolve(canvas.toDataURL("image/png").split(",")[1])
      }
      img.onerror = reject
      img.src = objectUrl
    })
  } catch {
    return undefined
  }
}

function amountInWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function sub(x: number): string {
    if (x === 0) return ""
    if (x < 20) return ones[x]
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "")
    return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + sub(x % 100) : "")
  }

  let dollars = Math.floor(n)
  const cents = Math.round((n - dollars) * 100)
  const parts: string[] = []
  if (dollars >= 1000) { parts.push(sub(Math.floor(dollars / 1000)) + " Thousand"); dollars = dollars % 1000 }
  if (dollars) parts.push(sub(dollars))
  let result = "US Dollars " + parts.join(" ")
  if (cents) result += ` and ${cents}/100`
  return result + " Only"
}

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }
function setTC(doc: jsPDF, rgb: readonly [number, number, number]) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }

export async function generateReceiptPDF(
  data: ReceiptData,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  const logoBase64 = await fetchLogoBase64()

  const doc = new jsPDF({ unit: "pt", format: "letter" })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const ML = 43
  const MR = 43
  const CW = PW - ML - MR
  let y = 36

  // Header
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", ML, y, 61, 68)
  }

  const orgRight = PW - MR
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); setTC(doc, DARK_RED)
  doc.text(data.orgInfo.name, orgRight, y + 14, { align: "right" })
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
  doc.text(data.orgInfo.address, orgRight, y + 28, { align: "right" })
  doc.text(`Email: ${data.orgInfo.email}, Phone: ${data.orgInfo.phone}`, orgRight, y + 41, { align: "right" })
  y += 78

  // Red rule
  setDraw(doc, DARK_RED); doc.setLineWidth(0.8)
  doc.line(ML, y, PW - MR, y)
  y += 14

  // Donor block (left) + receipt meta (right)
  const metaX = ML + CW * 0.58

  doc.setFontSize(10); doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
  doc.text("Received with thanks from", ML, y)
  y += 14

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); setTC(doc, BLACK)
  doc.text(data.donorName, ML, y)
  y += 13

  doc.setFontSize(9); doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
  let donorBlockEndY = y
  if (data.donorAddress) {
    const addrLines = doc.splitTextToSize(data.donorAddress, CW * 0.55)
    doc.text(addrLines, ML, y)
    donorBlockEndY = y + addrLines.length * 12
  }

  const metaTopY = y - 13 - 14
  const metaValueX = metaX + 72
  let my = metaTopY;
  ([["Receipt no.", data.receiptNumber], ["Date", format(data.donationDate, "dd/MM/yyyy")]] as [string, string][])
    .forEach(([label, value]) => {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); setTC(doc, BLACK)
      doc.text(label, metaX, my)
      doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
      doc.text(value, metaValueX, my)
      my += 16
    })

  y = donorBlockEndY + 18

  // Donations table
  const colHash = 25
  const colAmt = 86
  const rowH = 20
  const tableTopY = y

  setFill(doc, DARK_RED); doc.rect(ML, y, CW, rowH, "F")
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); setTC(doc, WHITE)
  doc.text("#", ML + 8, y + 13)
  doc.text("Donations for", ML + colHash + 6, y + 13)
  doc.text("Amount", ML + CW - 6, y + 13, { align: "right" })
  y += rowH

  setFill(doc, ROW_BG); doc.rect(ML, y, CW, rowH, "F")
  doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
  doc.text("1", ML + 8, y + 13)
  doc.text(data.note || "General donation", ML + colHash + 6, y + 13)
  doc.text(`$${data.donationAmount.toFixed(2)}`, ML + CW - 6, y + 13, { align: "right" })
  y += rowH

  y += rowH / 2

  setDraw(doc, DARK_RED); doc.setLineWidth(0.5)
  doc.line(ML, y, ML + CW, y)
  doc.setFontSize(10); doc.setFont("helvetica", "bold")
  setTC(doc, MID_GRAY); doc.text("Total", ML + CW - colAmt - 6, y + 13, { align: "right" })
  setTC(doc, DARK_RED); doc.text(`$${data.donationAmount.toFixed(2)}`, ML + CW - 6, y + 13, { align: "right" })
  y += rowH

  setDraw(doc, DARK_RED); doc.setLineWidth(0.5); doc.rect(ML, tableTopY, CW, y - tableTopY, "S")
  setDraw(doc, GOLD_LINE); doc.setLineWidth(0.3)
  doc.line(ML + colHash, tableTopY, ML + colHash, y)
  doc.line(ML + CW - colAmt, tableTopY, ML + CW - colAmt, y)
  y += 8

  // Total in words
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
  doc.text("Total In Words:", ML, y + 12)
  doc.setFont("helvetica", "bolditalic"); setTC(doc, BLACK)
  const wordLines = doc.splitTextToSize(amountInWords(data.donationAmount), CW - 94)
  doc.text(wordLines, ML + 94, y + 12)
  y += wordLines.length * 14 + 8 + 28

  // Signature
  setDraw(doc, MID_GRAY); doc.setLineWidth(0.5); doc.line(ML, y, ML + 130, y); y += 5
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); setTC(doc, BLACK)
  doc.text(data.orgInfo.representative, ML, y + 12); y += 14
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); setTC(doc, MID_GRAY)
  doc.text(data.orgInfo.title, ML, y + 12); y += 13
  doc.text(data.orgInfo.name, ML, y + 12)

  // Footer
  const footerY = PH - 40
  setDraw(doc, LT_GRAY); doc.setLineWidth(0.4); doc.line(ML, footerY, PW - MR, footerY)
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setTC(doc, LT_GRAY)
  const footerText =
    `Donations to ${data.orgInfo.name} are tax-deductible to the extent provided by law. ` +
    `This organization is a 501(c)(3) tax-exempt entity. EIN: ${data.orgInfo.ein}. ` +
    `No goods or services were provided in exchange for this contribution.`
  doc.text(doc.splitTextToSize(footerText, CW), ML, footerY + 10)
  doc.text("1", PW - MR, footerY + 10, { align: "right" })

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${data.receiptNumber}.pdf`)
}