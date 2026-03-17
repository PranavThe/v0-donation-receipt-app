"use client"

import Image from "next/image"
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
  firstName, lastName, email, address,
  donationAmount, donationDate, paymentMethod, note, receiptNumber,
}: ReceiptPreviewProps) {
  const hasMinimalData = firstName || lastName || donationAmount
  const displayReceiptNo = receiptNumber || `VSP-${format(new Date(), "yyyyMMdd")}-XXX`
  const displayAmount = donationAmount ? parseFloat(donationAmount) : 0
  const donorName = [firstName, lastName].filter(Boolean).join(" ") || "—"

  const RED = "#8B1A1A"
  const DARK = "#1a1a1a"
  const MID = "#4a4a4a"
  const LITE = "#7a7a7a"
  const WARM = "#f7f2ea"
  const GOLD = "#c8a96e"

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Receipt Preview</span>
      </div>

      <div className="bg-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {!hasMinimalData ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm" style={{ fontFamily: "system-ui" }}>Fill in the form to preview the receipt</p>
          </div>
        ) : (
          <div className="px-8 py-7">

            <div className="flex items-center justify-between pb-4" style={{ borderBottom: `2.5px solid ${RED}` }}>
              <Image src="/logo_no_bg2.webp" alt="VSP Logo" width={62} height={70} className="object-contain flex-shrink-0" />
              <div className="text-right">
                <p className="font-bold tracking-wide" style={{ fontSize: 15, color: RED, fontFamily: "system-ui" }}>{ORG_INFO.name}</p>
                <p className="mt-0.5" style={{ fontSize: 9, color: MID, lineHeight: 1.6, fontFamily: "system-ui" }}>
                  {ORG_INFO.address}<br />
                  Tel: {ORG_INFO.phone}&nbsp;&nbsp;|&nbsp;&nbsp;{ORG_INFO.email}<br />
                  {ORG_INFO.website}
                </p>
              </div>
            </div>

            <div className="text-center py-4">
              <p className="font-bold tracking-[0.2em] uppercase" style={{ fontSize: 13, color: DARK, fontFamily: "system-ui" }}>Donation Receipt</p>
              <div className="flex justify-center items-center gap-3 mt-1">
                <div style={{ height: 1, width: 40, backgroundColor: GOLD }} />
                <p style={{ fontSize: 8.5, color: LITE, letterSpacing: "0.05em", fontFamily: "system-ui" }}>501(c)(3) Tax-Exempt Organization &nbsp;·&nbsp; EIN: {ORG_INFO.ein}</p>
                <div style={{ height: 1, width: 40, backgroundColor: GOLD }} />
              </div>
            </div>

            <div className="mb-5 rounded" style={{ border: `1px solid #d9cfc4`, backgroundColor: WARM }}>
              <div className="flex" style={{ borderBottom: `1px solid #d9cfc4` }}>
                <div className="flex-1 px-4 py-2.5" style={{ borderRight: `1px solid #d9cfc4` }}>
                  <p style={{ fontSize: 7.5, color: LITE, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui" }}>Receipt Number</p>
                  <p className="font-bold mt-0.5" style={{ fontSize: 11, color: DARK, fontFamily: "system-ui", letterSpacing: "0.04em" }}>{displayReceiptNo}</p>
                </div>
                <div className="px-4 py-2.5" style={{ minWidth: 130 }}>
                  <p style={{ fontSize: 7.5, color: LITE, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui" }}>Date Issued</p>
                  <p className="font-bold mt-0.5" style={{ fontSize: 11, color: DARK, fontFamily: "system-ui" }}>{format(new Date(), "MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-1 px-4 py-2.5" style={{ borderRight: `1px solid #d9cfc4` }}>
                  <p style={{ fontSize: 7.5, color: LITE, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui" }}>Payment Method</p>
                  <p className="mt-0.5" style={{ fontSize: 10, color: MID, fontFamily: "system-ui" }}>{paymentMethod}</p>
                </div>
                <div className="px-4 py-2.5" style={{ minWidth: 130 }}>
                  <p style={{ fontSize: 7.5, color: LITE, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui" }}>Donation Date</p>
                  <p className="mt-0.5" style={{ fontSize: 10, color: MID, fontFamily: "system-ui" }}>{donationDate ? format(donationDate, "MMMM d, yyyy") : "—"}</p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <p style={{ fontSize: 7.5, color: LITE, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui", marginBottom: 6 }}>Received with Thanks from</p>
              <p className="font-bold" style={{ fontSize: 13, color: DARK, fontFamily: "system-ui" }}>{donorName}</p>
              {email && <p style={{ fontSize: 9.5, color: MID, fontFamily: "system-ui", marginTop: 2 }}>{email}</p>}
              {address && <p style={{ fontSize: 9.5, color: MID, fontFamily: "system-ui", marginTop: 1 }}>{address}</p>}
            </div>

            <table className="w-full mb-1" style={{ borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ backgroundColor: RED }}>
                  <th style={{ padding: "7px 10px", textAlign: "left", color: "white", fontFamily: "system-ui", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, width: 28 }}>#</th>
                  <th style={{ padding: "7px 10px", textAlign: "left", color: "white", fontFamily: "system-ui", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Description</th>
                  <th style={{ padding: "7px 10px", textAlign: "right", color: "white", fontFamily: "system-ui", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, width: 90 }}>Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: WARM, borderBottom: `1px solid #e8dfd3` }}>
                  <td style={{ padding: "9px 10px", color: MID, fontFamily: "system-ui", textAlign: "center" }}>1</td>
                  <td style={{ padding: "9px 10px", color: DARK, fontFamily: "system-ui" }}>{note || "General Donation"}</td>
                  <td style={{ padding: "9px 10px", color: DARK, fontFamily: "system-ui", textAlign: "right" }}>${displayAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f0ebe2", borderTop: `1.5px solid ${RED}` }}>
                  <td colSpan={2} style={{ padding: "8px 10px", fontFamily: "system-ui", fontWeight: 700, fontSize: 10, color: DARK, textAlign: "right", letterSpacing: "0.05em" }}>TOTAL</td>
                  <td style={{ padding: "8px 10px", fontFamily: "system-ui", fontWeight: 700, fontSize: 11, color: RED, textAlign: "right" }}>${displayAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex items-baseline gap-2 mb-6 mt-2 pb-4" style={{ borderBottom: `1px solid #e0d8ce` }}>
              <span style={{ fontSize: 8, color: LITE, fontFamily: "system-ui", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Amount in Words:</span>
              <span style={{ fontSize: 9.5, color: DARK, fontStyle: "italic" }}>{displayAmount > 0 ? amountInWords(displayAmount) : "—"}</span>
            </div>

            <div className="mb-6 px-4 py-3 rounded" style={{ backgroundColor: "#fdf9f4", border: `1px solid #e8dfd3` }}>
              <p style={{ fontSize: 8.5, color: MID, fontFamily: "system-ui", lineHeight: 1.7, fontStyle: "italic" }}>
                No goods or services were provided in exchange for this contribution. This letter serves as your official receipt for income tax purposes pursuant to IRC Section 170.
              </p>
            </div>

            <div className="mb-6">
              <p style={{ fontSize: 9, color: MID, fontFamily: "system-ui", marginBottom: 20 }}>Acknowledged with gratitude,</p>
              <div style={{ width: 160, borderBottom: `1px solid #999`, marginBottom: 5 }} />
              <p className="font-bold" style={{ fontSize: 10, color: DARK, fontFamily: "system-ui" }}>{ORG_INFO.representative}</p>
              <p style={{ fontSize: 9, color: MID, fontFamily: "system-ui", marginTop: 1 }}>{ORG_INFO.title}</p>
              <p style={{ fontSize: 9, color: MID, fontFamily: "system-ui" }}>{ORG_INFO.name}</p>
            </div>

            <div className="pt-3" style={{ borderTop: `1px solid #d0c8be` }}>
              <p style={{ fontSize: 7.5, color: LITE, fontFamily: "system-ui", lineHeight: 1.65, textAlign: "center" }}>
                <strong style={{ color: MID }}>{ORG_INFO.name}</strong> is a registered 501(c)(3) non-profit organization.
                Donations are tax-deductible to the full extent permitted by law.
                EIN: {ORG_INFO.ein} &nbsp;·&nbsp; {ORG_INFO.address}
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}