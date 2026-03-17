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
  const displayReceiptNumber = receiptNumber || `VSP-${format(new Date(), "yyyyMMdd")}-XXX`
  const displayAmount = donationAmount ? parseFloat(donationAmount) : 0

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Preview Header */}
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Receipt Preview</span>
      </div>

      {/* Receipt Document */}
      <div className="p-4 bg-white min-h-[500px]">
        {!hasMinimalData ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Fill in the form to preview the receipt</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Organization Header */}
            <div className="text-center pb-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-primary">{ORG_INFO.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">{ORG_INFO.address}</p>
              <p className="text-[10px] text-muted-foreground">
                Phone: {ORG_INFO.phone} | Email: {ORG_INFO.email}
              </p>
              <p className="text-[10px] text-muted-foreground">Website: {ORG_INFO.website}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                501(c)(3) Tax-Exempt Organization | EIN: {ORG_INFO.ein}
              </p>
            </div>

            {/* Receipt Title */}
            <div className="text-center py-2">
              <h4 className="text-sm font-bold text-foreground tracking-wide">DONATION RECEIPT</h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                Receipt No: {displayReceiptNumber}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Date Issued: {format(new Date(), "MMMM d, yyyy")}
              </p>
            </div>

            {/* Donor Information */}
            <div className="bg-muted/30 rounded p-3">
              <p className="font-semibold text-[10px] text-muted-foreground mb-2">DONOR INFORMATION</p>
              <p className="text-foreground">
                Name: {firstName || "—"} {lastName || ""}
              </p>
              <p className="text-foreground">Email: {email || "—"}</p>
              {address && <p className="text-foreground">Address: {address}</p>}
            </div>

            {/* Donation Details */}
            <div className="bg-muted/30 rounded p-3">
              <p className="font-semibold text-[10px] text-muted-foreground mb-2">DONATION DETAILS</p>
              <p className="text-lg font-bold text-primary">
                ${displayAmount.toFixed(2)} USD
              </p>
              <p className="text-foreground mt-1">
                Date of Donation: {donationDate ? format(donationDate, "MMMM d, yyyy") : "—"}
              </p>
              <p className="text-foreground">Payment Method: {paymentMethod}</p>
              {note && <p className="text-foreground">Purpose: {note}</p>}
            </div>

            {/* Tax Statement */}
            <div className="bg-muted/20 rounded p-3 italic text-[10px] text-muted-foreground">
              No goods or services were provided in exchange for this contribution. 
              This letter serves as your official receipt for tax purposes.
            </div>

            {/* Signature */}
            <div className="pt-2">
              <p className="text-muted-foreground">With gratitude,</p>
              <div className="mt-6 pt-1 border-t border-foreground/30 w-32">
                <p className="font-semibold text-foreground">{ORG_INFO.representative}</p>
                <p className="text-muted-foreground">{ORG_INFO.title}</p>
                <p className="text-muted-foreground">{ORG_INFO.name}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 text-[10px] text-muted-foreground">
              Thank you for your generous support of the Vedanta Society of Providence.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
