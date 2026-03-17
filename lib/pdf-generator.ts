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

// Palette (exact match to ReceiptPreview)
const C = {
  red: [139, 26, 26] as const,   // #8B1A1A
  dark: [26, 26, 26] as const,   // #1a1a1a
  mid: [74, 74, 74] as const,   // #4a4a4a
  lite: [122, 122, 122] as const,   // #7a7a7a
  warm: [247, 242, 234] as const,   // #f7f2ea
  warmDark: [240, 235, 226] as const,   // #f0ebe2
  gold: [200, 169, 110] as const,   // #c8a96e
  border: [217, 207, 196] as const,   // #d9cfc4
  border2: [232, 223, 211] as const,   // #e8dfd3
  border3: [224, 216, 206] as const,   // #e0d8ce
  border4: [208, 200, 190] as const,   // #d0c8be
  attest: [253, 249, 244] as const,   // #fdf9f4
  white: [255, 255, 255] as const,
  sigLine: [153, 153, 153] as const,   // #999
}

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

function sf(doc: jsPDF, c: readonly [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]) }
function sd(doc: jsPDF, c: readonly [number, number, number]) { doc.setDrawColor(c[0], c[1], c[2]) }
function st(doc: jsPDF, c: readonly [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]) }

export async function generateReceiptPDF(
  data: ReceiptData,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  const logoBase64 = await fetchLogoBase64()

  const doc = new jsPDF({ unit: "pt", format: "letter" })
  const PW = doc.internal.pageSize.getWidth()   // 612 pt
  const PH = doc.internal.pageSize.getHeight()  // 792 pt
  const ML = 36
  const MR = 36
  const CW = PW - ML - MR   // 540 pt
  let y = 28

  // ── LETTERHEAD ─────────────────────────────────────────────────────────────
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", ML, y, 56, 63)
  }

  const rx = PW - MR
  doc.setFontSize(15); doc.setFont("helvetica", "bold"); st(doc, C.red)
  doc.text(data.orgInfo.name, rx, y + 15, { align: "right" })
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  doc.text(data.orgInfo.address, rx, y + 30, { align: "right" })
  doc.text(`Tel: ${data.orgInfo.phone}  |  ${data.orgInfo.email}`, rx, y + 44, { align: "right" })
  doc.text(data.orgInfo.website, rx, y + 58, { align: "right" })
  y += 71

  // Thick red rule (2.5px)
  sd(doc, C.red); doc.setLineWidth(2)
  doc.line(ML, y, PW - MR, y)
  y += 2

  // ── TITLE BAND ─────────────────────────────────────────────────────────────
  y += 16
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text("OFFICIAL DONATION RECEIPT", PW / 2, y, { align: "center" })
  y += 10

  // Subtitle with gold flanking lines
  y += 4
  const subtitle = `501(c)(3) Tax-Exempt Organization  \u00b7  EIN: ${data.orgInfo.ein}`
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  const subW = doc.getTextWidth(subtitle)
  const lineW = 29
  const subX = (PW / 2) - (subW / 2)
  sd(doc, C.gold); doc.setLineWidth(0.7)
  doc.line(subX - lineW - 8, y, subX - 8, y)
  doc.text(subtitle, PW / 2, y + 1, { align: "center" })
  doc.line(subX + subW + 8, y, subX + subW + 8 + lineW, y)
  y += 16

  // ── META BOX (2×2 grid) ─────────────────────────────────────────────────────
  const cellH = 34
  const halfW = CW / 2
  const metaH = cellH * 2

  sf(doc, C.warm); sd(doc, C.border); doc.setLineWidth(0.7)
  doc.rect(ML, y, CW, metaH, "FD")
  doc.setLineWidth(0.5)
  doc.line(ML, y + cellH, ML + CW, y + cellH)  // horizontal mid
  doc.line(ML + halfW, y, ML + halfW, y + metaH)  // vertical mid

  function metaCell(cx: number, cy: number, label: string, value: string, bold: boolean) {
    const px = cx + 14
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
    doc.text(label.toUpperCase(), px, cy + 11)
    doc.setFontSize(bold ? 11 : 10)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    st(doc, bold ? C.dark : C.mid)
    doc.text(value, px, cy + 24)
  }

  metaCell(ML, y, "Receipt Number", data.receiptNumber, true)
  metaCell(ML + halfW, y, "Date Issued", format(new Date(), "MMMM d, yyyy"), true)
  metaCell(ML, y + cellH, "Payment Method", data.paymentMethod, false)
  metaCell(ML + halfW, y + cellH, "Donation Date", format(data.donationDate, "MMMM d, yyyy"), false)
  y += metaH + 20

  // ── DONOR SECTION ──────────────────────────────────────────────────────────
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  doc.text("RECEIVED WITH THANKS FROM", ML, y)
  y += 12

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text(data.donorName, ML, y)
  y += 14

  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  if (data.donorEmail) { doc.text(data.donorEmail, ML, y); y += 12 }
  if (data.donorAddress) {
    const aLines = doc.splitTextToSize(data.donorAddress, CW * 0.7)
    doc.text(aLines, ML, y)
    y += aLines.length * 12
  }
  y += 20

  // ── DONATIONS TABLE ─────────────────────────────────────────────────────────
  const colNo = 26
  const colAmt = 90
  const hRowH = 22
  const dRowH = 28
  const fRowH = 26
  const pad = 10
  const tblTop = y

  // Header
  sf(doc, C.red); doc.rect(ML, y, CW, hRowH, "F")
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); st(doc, C.white)
  doc.text("#", ML + pad, y + 14)
  doc.text("DESCRIPTION", ML + colNo + pad, y + 14)
  doc.text("AMOUNT (USD)", PW - MR - pad, y + 14, { align: "right" })
  y += hRowH

  // Data row
  sf(doc, C.warm); doc.rect(ML, y, CW, dRowH, "F")
  sd(doc, C.border2); doc.setLineWidth(0.5)
  doc.line(ML, y + dRowH, ML + CW, y + dRowH)
  const amtStr = "$" + data.donationAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  doc.setFontSize(10); doc.setFont("helvetica", "normal")
  st(doc, C.mid); doc.text("1", ML + pad + 3, y + 18, { align: "center" })
  st(doc, C.dark); doc.text(data.note || "General Donation", ML + colNo + pad, y + 18)
  st(doc, C.dark); doc.text(amtStr, PW - MR - pad, y + 18, { align: "right" })
  y += dRowH

  // Total row
  sf(doc, C.warmDark); doc.rect(ML, y, CW, fRowH, "F")
  sd(doc, C.red); doc.setLineWidth(1.5)
  doc.line(ML, y, ML + CW, y)
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text("TOTAL", PW - MR - colAmt - pad, y + 17, { align: "right" })
  doc.setFontSize(11); st(doc, C.red)
  doc.text(amtStr, PW - MR - pad, y + 17, { align: "right" })
  y += fRowH

  // Outer table border
  sd(doc, C.border); doc.setLineWidth(0.5)
  doc.rect(ML, tblTop, CW, y - tblTop, "S")
  y += 4

  // ── AMOUNT IN WORDS ────────────────────────────────────────────────────────
  y += 8
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  doc.text("AMOUNT IN WORDS:", ML, y)
  const labelW = doc.getTextWidth("AMOUNT IN WORDS:") + 6
  doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); st(doc, C.dark)
  const wordLines = doc.splitTextToSize(amountInWords(data.donationAmount), CW - labelW)
  doc.text(wordLines, ML + labelW, y)
  y += Math.max(wordLines.length * 12, 12) + 8
  sd(doc, C.border3); doc.setLineWidth(0.5)
  doc.line(ML, y, PW - MR, y)
  y += 24

  // ── ATTESTATION BOX ────────────────────────────────────────────────────────
  const attestText =
    "No goods or services were provided in exchange for this contribution. This letter serves as your " +
    "official receipt for income tax purposes pursuant to IRC Section 170."
  doc.setFontSize(8.5); doc.setFont("helvetica", "italic"); st(doc, C.mid)
  const attestLines = doc.splitTextToSize(attestText, CW - 28)
  const attestH = attestLines.length * 14 + 14
  sf(doc, C.attest); sd(doc, C.border2); doc.setLineWidth(0.5)
  doc.roundedRect(ML, y, CW, attestH, 2, 2, "FD")
  doc.text(attestLines, ML + 14, y + 12)
  y += attestH + 24

  // ── SIGNATURE ──────────────────────────────────────────────────────────────
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  doc.text("Acknowledged with gratitude,", ML, y)
  y += 22

  sd(doc, C.sigLine); doc.setLineWidth(0.5)
  doc.line(ML, y, ML + 115, y)
  y += 7

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text(data.orgInfo.representative, ML, y); y += 12
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  doc.text(data.orgInfo.title, ML, y); y += 11
  doc.text(data.orgInfo.name, ML, y); y += 24

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const footerY = Math.max(y, PH - 50)
  sd(doc, C.border4); doc.setLineWidth(0.5)
  doc.line(ML, footerY, PW - MR, footerY)
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  const footerText =
    `${data.orgInfo.name} is a registered 501(c)(3) non-profit organization. ` +
    `Donations are tax-deductible to the full extent permitted by law. ` +
    `EIN: ${data.orgInfo.ein}  \u00b7  ${data.orgInfo.address}`
  doc.text(doc.splitTextToSize(footerText, CW), PW / 2, footerY + 10, { align: "center" })

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${data.receiptNumber}.pdf`)
}