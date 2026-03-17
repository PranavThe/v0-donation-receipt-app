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

function buildReceiptHTML(data: ReceiptData): string {
  const amt = "$" + data.donationAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Donation Receipt ${data.receiptNumber}</title>
  <style>
    @media print {
      @page { margin: 0; size: letter portrait; }
      body { margin: 0; }
      .no-print { display: none; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, Helvetica, Arial, sans-serif;
      background: #fff;
      color: #1a1a1a;
    }
    .page {
      width: 750px;
      margin: 0 auto;
      padding: 40px 50px 40px 50px;
      background: #fff;
    }
    /* LETTERHEAD */
    .letterhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 2.5px solid #8B1A1A;
      margin-bottom: 0;
    }
    .letterhead img { width: 62px; height: 70px; object-fit: contain; }
    .org-info { text-align: right; }
    .org-name { font-size: 15px; font-weight: 700; color: #8B1A1A; letter-spacing: 0.02em; }
    .org-detail { font-size: 9px; color: #4a4a4a; line-height: 1.7; margin-top: 3px; }
    /* TITLE */
    .title-band { text-align: center; padding: 16px 0; }
    .title-text { font-size: 13px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.2em; text-transform: uppercase; }
    .title-sub { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 5px; }
    .title-sub-line { height: 1px; width: 40px; background: #c8a96e; }
    .title-sub-text { font-size: 8.5px; color: #7a7a7a; letter-spacing: 0.05em; }
    /* META BOX */
    .meta-box { border: 1px solid #d9cfc4; border-radius: 4px; background: #f7f2ea; margin-bottom: 20px; }
    .meta-row { display: flex; border-bottom: 1px solid #d9cfc4; }
    .meta-row:last-child { border-bottom: none; }
    .meta-cell { flex: 1; padding: 10px 16px; border-right: 1px solid #d9cfc4; }
    .meta-cell:last-child { border-right: none; min-width: 160px; flex: 0 0 auto; }
    .meta-label { font-size: 7.5px; color: #7a7a7a; text-transform: uppercase; letter-spacing: 0.12em; }
    .meta-value-bold { font-size: 11px; font-weight: 700; color: #1a1a1a; margin-top: 3px; letter-spacing: 0.04em; }
    .meta-value { font-size: 10px; color: #4a4a4a; margin-top: 3px; }
    /* DONOR */
    .donor-section { margin-bottom: 20px; }
    .section-label { font-size: 7.5px; color: #7a7a7a; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
    .donor-name { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .donor-detail { font-size: 9.5px; color: #4a4a4a; margin-top: 2px; }
    /* TABLE */
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead tr { background: #8B1A1A; }
    thead th { padding: 7px 10px; color: #fff; font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; text-align: left; }
    thead th:last-child { text-align: right; width: 110px; }
    thead th:first-child { width: 30px; }
    tbody tr { background: #f7f2ea; border-bottom: 1px solid #e8dfd3; }
    tbody td { padding: 9px 10px; font-size: 10px; color: #1a1a1a; }
    tbody td:first-child { color: #4a4a4a; text-align: center; }
    tbody td:last-child { text-align: right; }
    tfoot tr { background: #f0ebe2; border-top: 1.5px solid #8B1A1A; }
    tfoot td { padding: 8px 10px; font-size: 10px; }
    tfoot td:nth-child(1) { text-align: right; font-weight: 700; color: #1a1a1a; letter-spacing: 0.05em; }
    tfoot td:nth-child(2) { text-align: right; font-weight: 700; font-size: 11px; color: #8B1A1A; width: 110px; }
    /* AMOUNT IN WORDS */
    .words-row {
      display: flex; align-items: baseline; gap: 8px;
      margin-top: 8px; margin-bottom: 24px;
      padding-bottom: 16px; border-bottom: 1px solid #e0d8ce;
    }
    .words-label { font-size: 8px; color: #7a7a7a; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
    .words-value { font-size: 9.5px; color: #1a1a1a; font-style: italic; }
    /* ATTESTATION */
    .attestation {
      background: #fdf9f4; border: 1px solid #e8dfd3; border-radius: 4px;
      padding: 12px 16px; margin-bottom: 24px;
    }
    .attestation p { font-size: 8.5px; color: #4a4a4a; line-height: 1.7; font-style: italic; }
    /* SIGNATURE */
    .signature { margin-bottom: 24px; }
    .sig-opening { font-size: 9px; color: #4a4a4a; margin-bottom: 20px; }
    .sig-line { width: 160px; border-bottom: 1px solid #999; margin-bottom: 5px; }
    .sig-name { font-size: 10px; font-weight: 700; color: #1a1a1a; }
    .sig-title { font-size: 9px; color: #4a4a4a; margin-top: 1px; }
    /* FOOTER */
    .footer { border-top: 1px solid #d0c8be; padding-top: 12px; }
    .footer p { font-size: 7.5px; color: #7a7a7a; line-height: 1.65; text-align: center; }
    .footer strong { color: #4a4a4a; }
    /* Print button */
    .print-btn {
      display: block; margin: 20px auto 0; padding: 10px 32px;
      background: #8B1A1A; color: white; border: none; border-radius: 4px;
      font-size: 14px; cursor: pointer; font-family: inherit;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- LETTERHEAD -->
    <div class="letterhead">
      <img src="/logo_no_bg2.webp" alt="VSP Logo" crossorigin="anonymous" />
      <div class="org-info">
        <div class="org-name">${data.orgInfo.name}</div>
        <div class="org-detail">
          ${data.orgInfo.address}<br/>
          Tel: ${data.orgInfo.phone}&nbsp;&nbsp;|&nbsp;&nbsp;${data.orgInfo.email}<br/>
          ${data.orgInfo.website}
        </div>
      </div>
    </div>

    <!-- TITLE -->
    <div class="title-band">
      <div class="title-text">Official Donation Receipt</div>
      <div class="title-sub">
        <div class="title-sub-line"></div>
        <div class="title-sub-text">501(c)(3) Tax-Exempt Organization &nbsp;·&nbsp; EIN: ${data.orgInfo.ein}</div>
        <div class="title-sub-line"></div>
      </div>
    </div>

    <!-- META BOX -->
    <div class="meta-box">
      <div class="meta-row">
        <div class="meta-cell">
          <div class="meta-label">Receipt Number</div>
          <div class="meta-value-bold">${data.receiptNumber}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Date Issued</div>
          <div class="meta-value-bold">${format(new Date(), "MMMM d, yyyy")}</div>
        </div>
      </div>
      <div class="meta-row">
        <div class="meta-cell">
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">${data.paymentMethod}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Donation Date</div>
          <div class="meta-value">${format(data.donationDate, "MMMM d, yyyy")}</div>
        </div>
      </div>
    </div>

    <!-- DONOR -->
    <div class="donor-section">
      <div class="section-label">Received with Thanks from</div>
      <div class="donor-name">${data.donorName}</div>
      ${data.donorEmail ? `<div class="donor-detail">${data.donorEmail}</div>` : ""}
      ${data.donorAddress ? `<div class="donor-detail">${data.donorAddress}</div>` : ""}
    </div>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Amount (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${data.note || "General Donation"}</td>
          <td>${amt}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">TOTAL</td>
          <td>${amt}</td>
        </tr>
      </tfoot>
    </table>

    <!-- AMOUNT IN WORDS -->
    <div class="words-row">
      <span class="words-label">Amount in Words:</span>
      <span class="words-value">${amountInWords(data.donationAmount)}</span>
    </div>

    <!-- ATTESTATION -->
    <div class="attestation">
      <p>No goods or services were provided in exchange for this contribution. This letter serves as your
      official receipt for income tax purposes pursuant to IRC Section 170.</p>
    </div>

    <!-- SIGNATURE -->
    <div class="signature">
      <div class="sig-opening">Acknowledged with gratitude,</div>
      <div class="sig-line"></div>
      <div class="sig-name">${data.orgInfo.representative}</div>
      <div class="sig-title">${data.orgInfo.title}</div>
      <div class="sig-title">${data.orgInfo.name}</div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p><strong>${data.orgInfo.name}</strong> is a registered 501(c)(3) non-profit organization.
      Donations are tax-deductible to the full extent permitted by law.
      EIN: ${data.orgInfo.ein} &nbsp;·&nbsp; ${data.orgInfo.address}</p>
    </div>

    <!-- Print button (hidden when printing) -->
    <button class="print-btn no-print" onclick="window.print()">Save as PDF</button>

  </div>
</body>
</html>`
}

export async function generateReceiptPDF(
  data: ReceiptData,
  options?: { returnBase64?: boolean }
): Promise<string | void> {
  const html = buildReceiptHTML(data)

  if (options?.returnBase64) {
    // For email: encode the HTML directly as base64
    // The email API can send this as an HTML attachment or render it server-side
    return btoa(unescape(encodeURIComponent(html)))
  }

  // Open a print window — browser handles PDF generation natively
  const win = window.open("", "_blank", "width=900,height=700")
  if (!win) {
    alert("Please allow popups for this site to download receipts.")
    return
  }
  win.document.write(html)
  win.document.close()

  // Wait for the image to load before triggering print
  win.onload = () => {
    setTimeout(() => {
      win.focus()
      win.print()
    }, 500)
  }
}