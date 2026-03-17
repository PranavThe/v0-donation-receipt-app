"use client"

import { format } from "date-fns"
import { FileText } from "lucide-react"

interface ReceiptPreviewProps {
  firstName: string
  lastName: string
  email: string
  address?: string
  donationAmount: string
  donationDate: Date | undefined
  paymentMethod: string
  note?: string
  receiptNumber?: string
}

const ORG_INFO = {
  name: "Vedanta Society of Providence",
  address: "227 Angell Street, Providence, Rhode Island 02906, USA",
  phone: "(401) 421-3960",
  email: "providence@rkmm.org",
  website: "vedantaprov.org",
  ein: "05-0385129",
  representative: "Swami Yogatmananda",
  title: "Minister-in-Charge",
}

// ── Amount → words helper ─────────────────────────────────────────────────────
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
  if (dollars >= 1000) { parts.push(sub(Math.floor(dollars / 1000)) + " Thousand"); dollars %= 1000 }
  if (dollars) parts.push(sub(dollars))
  let result = "US Dollars " + parts.join(" ")
  if (cents) result += ` and ${cents}/100`
  return result + " Only"
}

export function ReceiptPreview({
  firstName,
  lastName,
  email,
  address,
  donationAmount,
  donationDate,
  paymentMethod,
  note,
  receiptNumber,
}: ReceiptPreviewProps) {
  const hasMinimalData = firstName || lastName || donationAmount
  const displayReceiptNo = receiptNumber || `VSP-${format(new Date(), "yyyyMMdd")}-XXX`
  const displayAmount = donationAmount ? parseFloat(donationAmount) : 0
  const donorName = [firstName, lastName].filter(Boolean).join(" ") || "—"
  const donorAddress = address || ""

  // Colours matching the PDF generator
  const darkRed = "#8B1A1A"
  const midGray = "#444444"
  const ltGray = "#888888"
  const rowBg = "#FDF6EC"
  const goldLine = "#E0C8A0"

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Receipt Preview</span>
      </div>

      {/* Receipt document */}
      <div className="p-5 bg-white min-h-[580px] font-sans">
        {!hasMinimalData ? (
          <div className="flex flex-col items-center justify-center h-[480px] text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Fill in the form to preview the receipt</p>
          </div>
        ) : (
          <div className="text-[11px] leading-snug">

            {/* ── HEADER: logo left, org info right ── */}
            <div className="flex items-start justify-between mb-2">
              {/* Logo */}
              <img
                src="/logo_no_bg2.webp"
                alt="VSP Logo"
                className="w-14 h-16 object-contain flex-shrink-0"
              />

              {/* Org info – right-aligned */}
              <div className="text-right ml-4">
                <p className="text-[15px] font-bold" style={{ color: darkRed }}>
                  {ORG_INFO.name}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: midGray }}>
                  {ORG_INFO.address}
                </p>
                <p className="text-[9px]" style={{ color: midGray }}>
                  Email: {ORG_INFO.email}, Phone: {ORG_INFO.phone}
                </p>
              </div>
            </div>

            {/* ── Red rule ── */}
            <hr style={{ borderColor: darkRed, borderTopWidth: 1 }} className="mb-3" />

            {/* ── Donor block (left) + Receipt meta (right) ── */}
            <div className="flex justify-between mb-4">
              {/* Donor */}
              <div className="w-[55%]">
                <p style={{ color: midGray }}>Received with thanks from</p>
                <p className="font-bold text-[12px] text-black mt-0.5">{donorName}</p>
                {donorAddress && (
                  <p className="text-[9px] mt-0.5 whitespace-pre-line" style={{ color: midGray }}>
                    {donorAddress}
                  </p>
                )}
              </div>

              {/* Receipt meta */}
              <div className="w-[42%]">
                {([
                  ["Receipt no.", displayReceiptNo],
                  ["Date", donationDate ? format(donationDate, "dd/MM/yyyy") : "—"],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex gap-2 mb-1">
                    <span className="font-bold text-black w-[80px] flex-shrink-0">{label}</span>
                    <span style={{ color: midGray }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Donations table ── */}
            <table className="w-full border-collapse text-[10px] mb-1"
              style={{ borderColor: darkRed }}>
              <thead>
                <tr style={{ backgroundColor: darkRed, color: "white" }}>
                  <th className="py-1.5 px-2 text-left w-6">#</th>
                  <th className="py-1.5 px-2 text-left">Donations for</th>
                  <th className="py-1.5 px-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: rowBg }}>
                  <td className="py-1.5 px-2 text-center" style={{ color: midGray }}>1</td>
                  <td className="py-1.5 px-2" style={{ color: midGray }}>
                    {note || "General donation"}
                  </td>
                  <td className="py-1.5 px-2 text-right" style={{ color: midGray }}>
                    ${displayAmount.toFixed(2)}
                  </td>
                </tr>
                {/* spacer */}
                <tr><td colSpan={3} className="py-0.5" /></tr>
                {/* total */}
                <tr style={{ borderTop: `1px solid ${darkRed}` }}>
                  <td />
                  <td className="py-1.5 px-2 text-right font-bold" style={{ color: midGray }}>
                    Total
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold" style={{ color: darkRed }}>
                    ${displayAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Total in words ── */}
            <div className="flex gap-2 mb-6 mt-1">
              <span style={{ color: midGray }} className="flex-shrink-0">Total In Words:</span>
              <span className="font-bold italic text-black">
                {displayAmount > 0 ? amountInWords(displayAmount) : "—"}
              </span>
            </div>

            {/* ── Signature ── */}
            <div className="mt-4">
              <div className="w-32 border-t mb-1" style={{ borderColor: midGray }} />
              <p className="font-bold text-black">{ORG_INFO.representative}</p>
              <p style={{ color: midGray }}>{ORG_INFO.title}</p>
              <p style={{ color: midGray }}>{ORG_INFO.name}</p>
            </div>

            {/* ── Footer ── */}
            <div className="mt-8 pt-2" style={{ borderTop: `1px solid ${ltGray}` }}>
              <p className="text-[8px]" style={{ color: ltGray }}>
                Donations to <strong>{ORG_INFO.name}</strong> are tax-deductible to the extent
                provided by law. This organization is a 501(c)(3) tax-exempt entity.{" "}
                EIN: {ORG_INFO.ein}. No goods or services were provided in exchange for this
                contribution.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}