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

// ── Colours ──────────────────────────────────────────────────────────────────
const DARK_RED = [139, 26, 26] as const   // #8B1A1A
const MID_GRAY = [68, 68, 68] as const   // #444444
const LT_GRAY = [136, 136, 136] as const   // #888888
const ROW_BG = [253, 246, 236] as const   // #FDF6EC
const GOLD_LINE = [224, 200, 160] as const   // #E0C8A0
const WHITE = [255, 255, 255] as const
const BLACK = [0, 0, 0] as const

// ── Amount → words (up to 999,999) ───────────────────────────────────────────
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

  if (dollars >= 1000) {
    parts.push(sub(Math.floor(dollars / 1000)) + " Thousand")
    dollars = dollars % 1000
  }
  if (dollars) parts.push(sub(dollars))

  let result = "US Dollars " + parts.join(" ")
  if (cents) result += ` and ${cents}/100`
  return result + " Only"
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}
function setTextColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateReceiptPDF(
  data: ReceiptData,
  logoBase64?: string,          // pass base64 PNG/WEBP of the logo
  options?: { returnBase64?: boolean }
): string | void {

  const doc = new jsPDF({ unit: "pt", format: "letter" })
  const PW = doc.internal.pageSize.getWidth()   // 612
  const PH = doc.internal.pageSize.getHeight()  // 792
  const ML = 43   // left margin  (≈ 0.6 in)
  const MR = 43   // right margin
  const CW = PW - ML - MR                       // content width ≈ 526
  let y = 36   // current y cursor (≈ 0.5 in top margin)

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Logo (left)
  if (logoBase64) {
    doc.addImage(logoBase64, "WEBP", ML, y, 61, 68)  // ~0.85 × 0.95 in
  }

  // Org name + contact (right-aligned)
  const orgRight = PW - MR
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  setTextColor(doc, DARK_RED)
  doc.text(data.orgInfo.name, orgRight, y + 14, { align: "right" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, MID_GRAY)
  doc.text(data.orgInfo.address, orgRight, y + 28, { align: "right" })
  doc.text(
    `Email: ${data.orgInfo.email}, Phone: ${data.orgInfo.phone}`,
    orgRight, y + 41, { align: "right" }
  )
  y += 78

  // ── Red rule ───────────────────────────────────────────────────────────────
  setDraw(doc, DARK_RED)
  doc.setLineWidth(0.8)
  doc.line(ML, y, PW - MR, y)
  y += 14

  // ── DONOR block (left) + Receipt meta (right) ──────────────────────────────
  const donorX = ML
  const metaX = ML + CW * 0.58   // meta table starts at ~58 % of content width

  // Donor
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, MID_GRAY)
  doc.text("Received with thanks from", donorX, y)
  y += 14

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  setTextColor(doc, BLACK)
  doc.text(data.donorName, donorX, y)
  y += 13

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, MID_GRAY)
  if (data.donorAddress) {
    const addrLines = doc.splitTextToSize(data.donorAddress, CW * 0.55)
    doc.text(addrLines, donorX, y)
    y += addrLines.length * 12
  }

  // Receipt meta (right side) — drawn at same top position as donor block
  const metaTopY = y - (data.donorAddress ? (doc.splitTextToSize(data.donorAddress, CW * 0.55).length * 12) : 0) - 13 - 14
  const metaLabelX = metaX
  const metaValueX = metaX + 72

  const metaRows: [string, string][] = [
    ["Receipt no.", data.receiptNumber],
    ["Date", format(data.donationDate, "dd/MM/yyyy")],
  ]

  let my = metaTopY
  metaRows.forEach(([label, value]) => {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    setTextColor(doc, BLACK)
    doc.text(label, metaLabelX, my)

    doc.setFont("helvetica", "normal")
    setTextColor(doc, MID_GRAY)
    doc.text(value, metaValueX, my)
    my += 16
  })

  y += 18

  // ── DONATIONS TABLE ────────────────────────────────────────────────────────
  const colHash = 25
  const colAmt = 86
  const colDesc = CW - colHash - colAmt
  const rowH = 20
  const tblX = ML

  // Header row
  setFill(doc, DARK_RED)
  doc.rect(tblX, y, CW, rowH, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  setTextColor(doc, WHITE)
  doc.text("#", tblX + 8, y + 13)
  doc.text("Donations for", tblX + colHash + 6, y + 13)
  doc.text("Amount", tblX + CW - 6, y + 13, { align: "right" })
  y += rowH

  // Data row
  setFill(doc, ROW_BG)
  doc.rect(tblX, y, CW, rowH, "F")
  doc.setFont("helvetica", "normal")
  setTextColor(doc, MID_GRAY)
  doc.text("1", tblX + 8, y + 13, { align: "left" })
  doc.text(data.note || "General donation", tblX + colHash + 6, y + 13)
  doc.text(`$${data.donationAmount.toFixed(2)}`, tblX + CW - 6, y + 13, { align: "right" })
  y += rowH

  // Empty spacer row
  doc.rect(tblX, y, CW, rowH / 2, "S")
  // (no fill — white)
  y += rowH / 2

  // Total row
  setDraw(doc, DARK_RED)
  doc.setLineWidth(0.5)
  doc.line(tblX, y, tblX + CW, y)   // line above total

  const totalRowH = 20
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  setTextColor(doc, MID_GRAY)
  doc.text("Total", tblX + CW - colAmt - 6, y + 13, { align: "right" })

  setTextColor(doc, DARK_RED)
  doc.text(`$${data.donationAmount.toFixed(2)}`, tblX + CW - 6, y + 13, { align: "right" })
  y += totalRowH

  // Outer border
  setDraw(doc, DARK_RED)
  doc.setLineWidth(0.5)
  const tableTopY = y - rowH * 2 - rowH / 2 - totalRowH - rowH  // recalculate table top
  // draw border around the whole table block
  doc.rect(tblX, tableTopY, CW,
    rowH +           // header
    rowH +           // data row
    rowH / 2 +       // spacer
    totalRowH,       // total
    "S"
  )
  // vertical separator after # column
  setDraw(doc, GOLD_LINE)
  doc.setLineWidth(0.3)
  doc.line(tblX + colHash, tableTopY, tblX + colHash, tableTopY + rowH * 2 + rowH / 2 + totalRowH)
  // vertical separator before Amount column
  doc.line(tblX + CW - colAmt, tableTopY, tblX + CW - colAmt, tableTopY + rowH * 2 + rowH / 2 + totalRowH)

  y += 8

  // ── Total in words ─────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, MID_GRAY)
  doc.text("Total In Words:", ML, y + 12)

  doc.setFont("helvetica", "bolditalic")
  setTextColor(doc, BLACK)
  const wordLines = doc.splitTextToSize(amountInWords(data.donationAmount), CW - 94)
  doc.text(wordLines, ML + 94, y + 12)
  y += wordLines.length * 14 + 8

  y += 28

  // ── SIGNATURE ──────────────────────────────────────────────────────────────
  setDraw(doc, MID_GRAY)
  doc.setLineWidth(0.5)
  doc.line(ML, y, ML + 130, y)
  y += 5

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  setTextColor(doc, BLACK)
  doc.text(data.orgInfo.representative, ML, y + 12)
  y += 14

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, MID_GRAY)
  doc.text(data.orgInfo.title, ML, y + 12)
  y += 13
  doc.text(data.orgInfo.name, ML, y + 12)

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const footerY = PH - 40
  setDraw(doc, LT_GRAY)
  doc.setLineWidth(0.4)
  doc.line(ML, footerY, PW - MR, footerY)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, LT_GRAY)
  const footerText =
    `Donations to ${data.orgInfo.name} are tax-deductible to the extent provided by law. ` +
    `This organization is a 501(c)(3) tax-exempt entity. EIN: ${data.orgInfo.ein}. ` +
    `No goods or services were provided in exchange for this contribution.`
  const footerLines = doc.splitTextToSize(footerText, CW)
  doc.text(footerLines, ML, footerY + 10)

  // Page number (bottom-right)
  doc.text("1", PW - MR, footerY + 10, { align: "right" })

  // ── Output ─────────────────────────────────────────────────────────────────
  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${data.receiptNumber}.pdf`)
}