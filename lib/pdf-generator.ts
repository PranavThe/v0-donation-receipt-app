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

// Palette
const RED = [139, 26, 26] as const   // #8B1A1A
const DARK = [26, 26, 26] as const   // #1a1a1a
const MID = [74, 74, 74] as const   // #4a4a4a
const LITE = [122, 122, 122] as const   // #7a7a7a
const WARM = [247, 242, 234] as const   // #f7f2ea
const WARMDARK = [240, 235, 226] as const   // #f0ebe2
const GOLD = [200, 169, 110] as const   // #c8a96e
const BORDER = [217, 207, 196] as const   // #d9cfc4
const WHITE = [255, 255, 255] as const

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
  let d = Math.floor(n)
  const c = Math.round((n - d) * 100)
  const p: string[] = []
  if (d >= 1000) { p.push(sub(Math.floor(d / 1000)) + " Thousand"); d %= 1000 }
  if (d) p.push(sub(d))
  return "US Dollars " + p.join(" ") + (c ? ` and ${c}/100` : "") + " Only"
}

function F(doc: jsPDF, rgb: readonly [number, number, number]) { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
function D(doc: jsPDF, rgb: readonly [number, number, number]) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }
function T(doc: jsPDF, rgb: readonly [number, number, number]) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }

// Draw a labelled field cell (used in the meta grid)
function metaCell(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, rightBorder: boolean, bottomBorder: boolean,
  borderRgb: readonly [number, number, number], bgRgb: readonly [number, number, number]
) {
  F(doc, bgRgb); D(doc, borderRgb)
  doc.setLineWidth(0.4)
  doc.rect(x, y, w, h, "FD")
  if (!rightBorder) { F(doc, bgRgb); doc.rect(x + w - 0.5, y, 1, h, "F") }
  if (!bottomBorder) { F(doc, bgRgb); doc.rect(x, y + h - 0.5, w, 1, "F") }

  doc.setFontSize(7); doc.setFont("helvetica", "normal"); T(doc, LITE)
  doc.text(label.toUpperCase(), x + 8, y + 11)
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); T(doc, DARK)
  doc.text(value, x + 8, y + 22)
}

export async function generateReceiptPDF(
  data: ReceiptData,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  const logoBase64 = await fetchLogoBase64()

  const doc = new jsPDF({ unit: "pt", format: "letter" })
  const PW = doc.internal.pageSize.getWidth()   // 612
  const PH = doc.internal.pageSize.getHeight()  // 792
  const ML = 50
  const MR = 50
  const CW = PW - ML - MR   // 512
  let y = 42

  // ── LETTERHEAD ─────────────────────────────────────────────────────────────
  // Logo
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", ML, y, 64, 72)
  }

  // Org name + contact block (right-aligned)
  const rx = PW - MR
  doc.setFontSize(15); doc.setFont("helvetica", "bold"); T(doc, RED)
  doc.text(data.orgInfo.name, rx, y + 16, { align: "right" })

  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); T(doc, MID)
  doc.text(data.orgInfo.address, rx, y + 30, { align: "right" })
  doc.text(`Tel: ${data.orgInfo.phone}   |   ${data.orgInfo.email}`, rx, y + 41, { align: "right" })
  doc.text(data.orgInfo.website, rx, y + 52, { align: "right" })

  y += 82

  // Thick red rule
  D(doc, RED); doc.setLineWidth(2)
  doc.line(ML, y, PW - MR, y)
  y += 2

  // Thin gold rule
  D(doc, GOLD); doc.setLineWidth(0.6)
  doc.line(ML, y, PW - MR, y)
  y += 16

  // ── DOCUMENT TITLE ─────────────────────────────────────────────────────────
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); T(doc, DARK)
  doc.text("OFFICIAL DONATION RECEIPT", PW / 2, y, { align: "center" })
  y += 8

  // Subtitle line
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); T(doc, LITE)
  doc.text(
    `501(c)(3) Tax-Exempt Organization  ·  EIN: ${data.orgInfo.ein}`,
    PW / 2, y + 8, { align: "center" }
  )
  y += 24

  // ── META GRID (2×2) ────────────────────────────────────────────────────────
  const cellH = 34
  const halfW = CW / 2

  metaCell(doc, ML, y, halfW, cellH, "Receipt Number", data.receiptNumber, true, true, BORDER, WARM)
  metaCell(doc, ML + halfW, y, halfW, cellH, "Date Issued", format(new Date(), "MMMM d, yyyy"), false, true, BORDER, WARM)
  y += cellH
  metaCell(doc, ML, y, halfW, cellH, "Donation Date", format(data.donationDate, "MMMM d, yyyy"), true, false, BORDER, WARM)
  metaCell(doc, ML + halfW, y, halfW, cellH, "Payment Method", data.paymentMethod, false, false, BORDER, WARM)
  y += cellH + 20

  // ── DONOR SECTION ──────────────────────────────────────────────────────────
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); T(doc, LITE)
  doc.text("RECEIVED WITH THANKS FROM", ML, y)
  y += 10

  doc.setFontSize(12); doc.setFont("helvetica", "bold"); T(doc, DARK)
  doc.text(data.donorName, ML, y + 3)
  y += 16

  doc.setFontSize(9); doc.setFont("helvetica", "normal"); T(doc, MID)
  if (data.donorEmail) { doc.text(data.donorEmail, ML, y); y += 12 }
  if (data.donorAddress) {
    const lines = doc.splitTextToSize(data.donorAddress, CW * 0.7)
    doc.text(lines, ML, y)
    y += lines.length * 12
  }
  y += 14

  // ── DONATIONS TABLE ────────────────────────────────────────────────────────
  const colNo = 28
  const colAmt = 90
  const colDesc = CW - colNo - colAmt
  const rowH = 24
  const tblTop = y

  // Header
  F(doc, RED); D(doc, RED); doc.setLineWidth(0)
  doc.rect(ML, y, CW, rowH, "F")

  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); T(doc, WHITE)
  const hPad = 8
  doc.text("#", ML + hPad, y + 15.5)
  doc.text("DESCRIPTION", ML + colNo + hPad, y + 15.5)
  doc.text("AMOUNT (USD)", ML + CW - hPad, y + 15.5, { align: "right" })
  y += rowH

  // Data row
  F(doc, WARM); D(doc, BORDER); doc.setLineWidth(0.4)
  doc.rect(ML, y, CW, rowH, "FD")

  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); T(doc, MID)
  doc.text("1", ML + hPad + 4, y + 15.5, { align: "center" })
  T(doc, DARK)
  doc.text(data.note || "General Donation", ML + colNo + hPad, y + 15.5)
  const amtStr = "$" + data.donationAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })
  doc.text(amtStr, ML + CW - hPad, y + 15.5, { align: "right" })
  y += rowH

  // Subtotal spacer row
  F(doc, [235, 229, 220] as const); D(doc, BORDER); doc.setLineWidth(0.4)
  doc.rect(ML, y, CW, 2, "F")
  y += 2

  // Total row
  F(doc, WARMDARK); D(doc, RED); doc.setLineWidth(1.2)
  doc.rect(ML, y, CW, rowH + 2, "FD")
  doc.setLineWidth(0.4)

  doc.setFontSize(8); doc.setFont("helvetica", "bold"); T(doc, MID)
  doc.text("TOTAL DUE", ML + CW - colAmt - hPad, y + 16, { align: "right" })
  doc.setFontSize(12); T(doc, RED)
  doc.text(amtStr, ML + CW - hPad, y + 16.5, { align: "right" })
  y += rowH + 2

  // Column dividers (decorative)
  D(doc, GOLD); doc.setLineWidth(0.4)
  doc.line(ML + colNo, tblTop, ML + colNo, y)
  doc.line(ML + CW - colAmt, tblTop, ML + CW - colAmt, y)

  y += 10

  // ── AMOUNT IN WORDS ────────────────────────────────────────────────────────
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); T(doc, LITE)
  doc.text("AMOUNT IN WORDS:", ML, y + 10)
  doc.setFontSize(9); doc.setFont("helvetica", "bolditalic"); T(doc, DARK)
  const wordLines = doc.splitTextToSize(amountInWords(data.donationAmount), CW - 105)
  doc.text(wordLines, ML + 105, y + 10)
  y += wordLines.length * 13 + 6

  // Thin rule
  D(doc, BORDER); doc.setLineWidth(0.5)
  doc.line(ML, y, PW - MR, y)
  y += 16

  // ── ATTESTATION BOX ────────────────────────────────────────────────────────
  F(doc, [253, 249, 244] as const); D(doc, BORDER); doc.setLineWidth(0.4)
  doc.roundedRect(ML, y, CW, 32, 2, 2, "FD")
  doc.setFontSize(8); doc.setFont("helvetica", "italic"); T(doc, MID)
  const attestLines = doc.splitTextToSize(
    "No goods or services were provided in exchange for this contribution. " +
    "This letter serves as your official receipt for income tax purposes pursuant to IRC Section 170.",
    CW - 20
  )
  doc.text(attestLines, ML + 10, y + 11)
  y += 44

  // ── SIGNATURE ──────────────────────────────────────────────────────────────
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); T(doc, MID)
  doc.text("Acknowledged with gratitude,", ML, y)
  y += 22

  D(doc, MID); doc.setLineWidth(0.5)
  doc.line(ML, y, ML + 150, y)
  y += 5

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); T(doc, DARK)
  doc.text(data.orgInfo.representative, ML, y + 12)
  y += 14
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); T(doc, MID)
  doc.text(data.orgInfo.title, ML, y + 12); y += 12
  doc.text(data.orgInfo.name, ML, y + 12)

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const fy = PH - 38
  D(doc, GOLD); doc.setLineWidth(0.6)
  doc.line(ML, fy, PW - MR, fy)
  D(doc, BORDER); doc.setLineWidth(0.3)
  doc.line(ML, fy + 2, PW - MR, fy + 2)

  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); T(doc, LITE)
  const ftxt = `${data.orgInfo.name} is a registered 501(c)(3) non-profit organization. Donations are tax-deductible to the full extent permitted by law. EIN: ${data.orgInfo.ein}  ·  ${data.orgInfo.address}`
  const flines = doc.splitTextToSize(ftxt, CW)
  doc.text(flines, PW / 2, fy + 12, { align: "center" })

  // Page number
  doc.text("Page 1 of 1", PW - MR, fy + 12, { align: "right" })

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${data.receiptNumber}.pdf`)
}