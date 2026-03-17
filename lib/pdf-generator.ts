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

const C = {
  red: [139, 26, 26] as const,   // #8B1A1A
  dark: [26, 26, 26] as const,   // #1a1a1a
  mid: [74, 74, 74] as const,   // #4a4a4a
  lite: [122, 122, 122] as const,   // #7a7a7a
  warm: [247, 242, 234] as const,   // #f7f2ea
  warmDk: [240, 235, 226] as const,   // #f0ebe2
  gold: [200, 169, 110] as const,   // #c8a96e
  border: [217, 207, 196] as const,   // #d9cfc4
  border2: [232, 223, 211] as const,   // #e8dfd3
  border3: [224, 216, 206] as const,   // #e0d8ce
  border4: [208, 200, 190] as const,   // #d0c8be
  attest: [253, 249, 244] as const,   // #fdf9f4
  white: [255, 255, 255] as const,
  sig: [153, 153, 153] as const,
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

const sf = (d: jsPDF, c: readonly [number, number, number]) => d.setFillColor(c[0], c[1], c[2])
const sd = (d: jsPDF, c: readonly [number, number, number]) => d.setDrawColor(c[0], c[1], c[2])
const st = (d: jsPDF, c: readonly [number, number, number]) => d.setTextColor(c[0], c[1], c[2])

export async function generateReceiptPDF(
  data: ReceiptData,
  options?: { returnBase64?: boolean }
): Promise<string | void> {

  const logoBase64 = await fetchLogoBase64()

  const doc = new jsPDF({ unit: "pt", format: "letter" })
  const PW = doc.internal.pageSize.getWidth()   // 612
  const PH = doc.internal.pageSize.getHeight()  // 792
  const ML = 36, MR = 36, CW = PW - ML - MR    // margins, content width ~540
  let y = 28

  // ── LETTERHEAD ─────────────────────────────────────────────────────────────
  // Logo: left-aligned, ~62×70px equivalent
  if (logoBase64) doc.addImage(logoBase64, "PNG", ML, y, 62, 70)

  // Org block: right-aligned
  const rx = PW - MR
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); st(doc, C.red)
  doc.text(data.orgInfo.name, rx, y + 16, { align: "right" })
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  doc.text(data.orgInfo.address, rx, y + 32, { align: "right" })
  doc.text(`Tel: ${data.orgInfo.phone}  |  ${data.orgInfo.email}`, rx, y + 45, { align: "right" })
  doc.text(data.orgInfo.website, rx, y + 58, { align: "right" })

  // Red rule below letterhead (matches preview's pb-4 border-bottom 2.5px)
  y += 76
  sd(doc, C.red); doc.setLineWidth(2.5)
  doc.line(ML, y, PW - MR, y)
  y += 2

  // ── TITLE BAND ─────────────────────────────────────────────────────────────
  // "DONATION RECEIPT" — matches preview exactly (not "OFFICIAL...")
  y += 18
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  // Wide letter-spacing: draw with charSpace
  doc.text("DONATION RECEIPT", PW / 2, y, { align: "center", charSpace: 3 })
  y += 12

  // Gold flanking lines + subtitle
  const subtitle = `501(c)(3) Tax-Exempt Organization  \u00b7  EIN: ${data.orgInfo.ein}`
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  const subW = doc.getTextWidth(subtitle)
  const lineW = 30
  const subX = (PW / 2) - (subW / 2)
  sd(doc, C.gold); doc.setLineWidth(0.7)
  doc.line(subX - lineW - 8, y, subX - 8, y)
  doc.text(subtitle, PW / 2, y + 1, { align: "center" })
  doc.line(subX + subW + 8, y, subX + subW + 8 + lineW, y)
  y += 18

  // ── META BOX 2×2 ───────────────────────────────────────────────────────────
  // Taller cells to match the preview's py-2.5 padding
  const cellH = 40, halfW = CW / 2

  sf(doc, C.warm); sd(doc, C.border); doc.setLineWidth(0.7)
  doc.rect(ML, y, CW, cellH * 2, "FD")
  // Internal dividers
  sd(doc, C.border); doc.setLineWidth(0.5)
  doc.line(ML, y + cellH, ML + CW, y + cellH)  // horizontal mid
  doc.line(ML + halfW, y, ML + halfW, y + cellH * 2)  // vertical mid

  const metaCell = (cx: number, cy: number, label: string, value: string, bold: boolean) => {
    const px = cx + 14
    // Label: 7.5pt lite uppercase
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
    doc.text(label.toUpperCase(), px, cy + 13)
    // Value
    doc.setFontSize(bold ? 11 : 10)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    st(doc, bold ? C.dark : C.mid)
    doc.text(value, px, cy + 28)
  }

  metaCell(ML, y, "Receipt Number", data.receiptNumber, true)
  metaCell(ML + halfW, y, "Date Issued", format(new Date(), "MMMM d, yyyy"), true)
  metaCell(ML, y + cellH, "Payment Method", data.paymentMethod, false)
  metaCell(ML + halfW, y + cellH, "Donation Date", format(data.donationDate, "MMMM d, yyyy"), false)
  y += cellH * 2 + 22

  // ── DONOR SECTION ──────────────────────────────────────────────────────────
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  doc.text("RECEIVED WITH THANKS FROM", ML, y)
  y += 14

  // Donor name: bold 14pt matching preview
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text(data.donorName, ML, y)
  y += 16

  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  if (data.donorEmail) { doc.text(data.donorEmail, ML, y); y += 13 }
  if (data.donorAddress) {
    const al = doc.splitTextToSize(data.donorAddress, CW * 0.7)
    doc.text(al, ML, y); y += al.length * 13
  }
  y += 22

  // ── DONATIONS TABLE ─────────────────────────────────────────────────────────
  // Header row is taller to allow "AMOUNT\n(USD)" to wrap like the preview
  const colNo = 30
  const colAmt = 90
  const hH = 30    // taller header so text has room
  const dH = 30
  const fH = 28
  const pad = 10
  const tTop = y
  const amt = "$" + data.donationAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })

  // Header
  sf(doc, C.red); doc.rect(ML, y, CW, hH, "F")
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); st(doc, C.white)
  doc.text("#", ML + pad, y + hH / 2 + 3)
  doc.text("DESCRIPTION", ML + colNo + pad, y + hH / 2 + 3)
  // "AMOUNT\n(USD)" — two lines centred in the header cell
  doc.text("AMOUNT", PW - MR - pad, y + hH / 2 - 1, { align: "right" })
  doc.text("(USD)", PW - MR - pad, y + hH / 2 + 8, { align: "right" })
  y += hH

  // Data row
  sf(doc, C.warm); doc.rect(ML, y, CW, dH, "F")
  sd(doc, C.border2); doc.setLineWidth(0.5)
  doc.line(ML, y + dH, ML + CW, y + dH)
  doc.setFontSize(10); doc.setFont("helvetica", "normal")
  st(doc, C.mid); doc.text("1", ML + pad + 4, y + dH / 2 + 4, { align: "center" })
  st(doc, C.dark); doc.text(data.note || "General Donation", ML + colNo + pad, y + dH / 2 + 4)
  st(doc, C.dark); doc.text(amt, PW - MR - pad, y + dH / 2 + 4, { align: "right" })
  y += dH

  // Total row
  sf(doc, C.warmDk); doc.rect(ML, y, CW, fH, "F")
  sd(doc, C.red); doc.setLineWidth(1.5); doc.line(ML, y, ML + CW, y)
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text("TOTAL", PW - MR - colAmt - pad, y + fH / 2 + 4, { align: "right" })
  doc.setFontSize(11); st(doc, C.red)
  doc.text(amt, PW - MR - pad, y + fH / 2 + 4, { align: "right" })
  y += fH

  // Outer border + vertical dividers
  sd(doc, C.border); doc.setLineWidth(0.5); doc.rect(ML, tTop, CW, y - tTop, "S")
  sd(doc, C.gold); doc.setLineWidth(0.3)
  doc.line(ML + colNo, tTop, ML + colNo, y)
  doc.line(ML + CW - colAmt, tTop, ML + CW - colAmt, y)
  y += 10

  // ── AMOUNT IN WORDS ────────────────────────────────────────────────────────
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  doc.text("AMOUNT IN WORDS:", ML, y)
  const lw = doc.getTextWidth("AMOUNT IN WORDS:") + 6
  doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); st(doc, C.dark)
  const wl = doc.splitTextToSize(amountInWords(data.donationAmount), CW - lw)
  doc.text(wl, ML + lw, y)
  y += Math.max(wl.length * 13, 13) + 10

  // Thin rule below amount in words
  sd(doc, C.border3); doc.setLineWidth(0.5)
  doc.line(ML, y, PW - MR, y)
  y += 22

  // ── ATTESTATION BOX ────────────────────────────────────────────────────────
  const att = "No goods or services were provided in exchange for this contribution. This letter serves as your official receipt for income tax purposes pursuant to IRC Section 170."
  doc.setFontSize(8.5); doc.setFont("helvetica", "italic"); st(doc, C.mid)
  const al2 = doc.splitTextToSize(att, CW - 28)
  const attH = al2.length * 14 + 16
  sf(doc, C.attest); sd(doc, C.border2); doc.setLineWidth(0.5)
  doc.roundedRect(ML, y, CW, attH, 2, 2, "FD")
  doc.text(al2, ML + 14, y + 13)
  y += attH + 18

  // ── SIGNATURE ──────────────────────────────────────────────────────────────
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  doc.text("Acknowledged with gratitude,", ML, y)
  y += 24   // space below opening line

  // Signature line first, then name below it
  sd(doc, C.sig); doc.setLineWidth(0.5)
  doc.line(ML, y, ML + 160, y)
  y += 14   // name sits below the line

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); st(doc, C.dark)
  doc.text(data.orgInfo.representative, ML, y)
  y += 13
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); st(doc, C.mid)
  doc.text(data.orgInfo.title, ML, y); y += 12
  doc.text(data.orgInfo.name, ML, y); y += 16

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  // Always pin to bottom of page
  const fy = PH - 52
  sd(doc, C.border4); doc.setLineWidth(0.5)
  doc.line(ML, fy, PW - MR, fy)
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); st(doc, C.lite)
  const ft =
    `${data.orgInfo.name} is a registered 501(c)(3) non-profit organization. ` +
    `Donations are tax-deductible to the full extent permitted by law. ` +
    `EIN: ${data.orgInfo.ein}  \u00b7  ${data.orgInfo.address}`
  const ftLines = doc.splitTextToSize(ft, CW)
  doc.text(ftLines, PW / 2, fy + 12, { align: "center" })

  if (options?.returnBase64) {
    return doc.output("datauristring").split(",")[1]
  }
  doc.save(`Donation_Receipt_${data.receiptNumber}.pdf`)
}