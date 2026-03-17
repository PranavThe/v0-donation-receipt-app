import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      receiptNumber,
      firstName,
      lastName,
      email,
      donationAmount,
      donationDate,
      pdfBase64,
    } = body

    if (!receiptNumber || !email || !pdfBase64) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const formattedAmount = parseFloat(donationAmount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })

    const formattedDate = new Date(donationDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const { data, error } = await resend.emails.send({
      from: "Vedanta Society of Providence <onboarding@resend.dev>",
      to: email,
      subject: `Donation Receipt ${receiptNumber} – Vedanta Society of Providence`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #3d3d3d; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #c9a227; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #c9a227; margin: 0; font-size: 24px; font-weight: normal;">Vedanta Society of Providence</h1>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">227 Angell Street, Providence, Rhode Island 02906</p>
          </div>
          
          <p style="font-size: 16px;">Dear ${firstName} ${lastName},</p>
          
          <p style="font-size: 16px;">Thank you for your generous donation of <strong>${formattedAmount}</strong> made on ${formattedDate}.</p>
          
          <p style="font-size: 16px;">Your support helps sustain our mission of spreading the message of Vedanta and the universal teachings of Sri Ramakrishna, Holy Mother Sri Sarada Devi, and Swami Vivekananda.</p>
          
          <div style="background-color: #f8f5eb; border-left: 4px solid #c9a227; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Receipt Number:</strong> ${receiptNumber}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Donation Amount:</strong> ${formattedAmount}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Donation Date:</strong> ${formattedDate}</p>
          </div>
          
          <p style="font-size: 16px;">Please find your official donation receipt attached to this email. This receipt may be used for your tax records.</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 25px;">The Vedanta Society of Providence is a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code. Our EIN is ${ORG_INFO.ein}. No goods or services were provided in exchange for this donation.</p>
          
          <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
            <p style="font-size: 16px; margin-bottom: 5px;">With gratitude,</p>
            <p style="font-size: 16px; margin: 0;"><strong>${ORG_INFO.representative}</strong></p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;">${ORG_INFO.title}</p>
            <p style="font-size: 14px; color: #666; margin: 0;">Vedanta Society of Providence</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
            <p>${ORG_INFO.address}</p>
            <p>Phone: ${ORG_INFO.phone} | Email: ${ORG_INFO.email}</p>
            <p>Website: ${ORG_INFO.website}</p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `donation-receipt-${receiptNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    )
  }
}
