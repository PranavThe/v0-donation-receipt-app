import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const ORG_INFO = {
  name: "Vedanta Society of Providence",
  address: "227 Angell Street, Providence, RI 02906",
  phone: "401-421-3960",
  email: "providence@rkmm.org",
  website: "www.vedantaprov.org",
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
        <body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #3d3d3d; max-width: 600px; margin: 0 auto; padding: 30px 20px;">

          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #8B1A1A; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #8B1A1A; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.02em;">
              Vedanta Society of Providence
            </h1>
            <p style="color: #666; font-size: 13px; margin: 6px 0 0 0;">
              ${ORG_INFO.address} &nbsp;·&nbsp; ${ORG_INFO.phone} &nbsp;·&nbsp; ${ORG_INFO.website}
            </p>
          </div>

          <!-- Body -->
          <p style="font-size: 16px; margin-bottom: 20px;">
            My Dear ${firstName} ${lastName},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            On behalf of the Vedanta Society of Providence, please accept our heartfelt gratitude
            for your gracious donation of <strong>${formattedAmount}</strong> on ${formattedDate}.
            No goods or services were given for that amount. The whole amount is tax-deductible.
          </p>

          <p style="font-size: 16px; margin-bottom: 30px;">
            Please find your official donation receipt attached to this email.
          </p>

          <!-- Sign-off -->
          <p style="font-size: 16px; margin-bottom: 4px;">${ORG_INFO.representative}</p>
          <p style="font-size: 15px; color: #555; margin: 0 0 4px 0;">${ORG_INFO.title}</p>
          <p style="font-size: 15px; color: #555; margin: 0 0 4px 0;">Date: ${formattedDate}</p>

          <div style="margin: 24px 0; border-top: 1px solid #ddd;"></div>

          <!-- Org block -->
          <p style="font-size: 15px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
            ${ORG_INFO.representative.toUpperCase()}
          </p>
          <p style="font-size: 14px; margin: 4px 0 0 0;">Vedanta Society of Providence</p>
          <p style="font-size: 14px; color: #555; margin: 2px 0;">
            ${ORG_INFO.address}
          </p>
          <p style="font-size: 14px; color: #555; margin: 2px 0;">
            ${ORG_INFO.phone} &nbsp; ${ORG_INFO.website}
          </p>
          <p style="font-size: 14px; color: #555; margin: 2px 0;">
            EIN #${ORG_INFO.ein}
          </p>

          <div style="margin: 24px 0; border-top: 1px solid #ddd;"></div>

          <!-- Extra info -->
          <p style="font-size: 14px; color: #555; margin-bottom: 16px;">
            For more information about the Vedanta Society of Providence or about
            ${ORG_INFO.representative}, please visit our website.
          </p>

          <!-- Quote -->
          <p style="font-size: 15px; color: #8B1A1A; font-style: italic; text-align: center; margin: 20px 0; padding: 12px 20px; border-left: 3px solid #8B1A1A;">
            "Arise, Awake and Stop Not Till The Goal is Reached" — Swami Vivekananda
          </p>

          <div style="margin: 24px 0; border-top: 1px solid #ddd;"></div>

          <!-- No-reply notice -->
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            PLEASE DO NOT REPLY TO THIS EMAIL. THIS EMAIL ADDRESS IS NOT ATTENDED.<br/>
            PLEASE USE: <a href="mailto:${ORG_INFO.email}" style="color: #8B1A1A;">${ORG_INFO.email}</a> for e-correspondence with us.
          </p>

        </body>
        </html>
      `,
      // pdfBase64 is base64-encoded HTML (from window.print approach).
      // Attach as .html so the recipient can open it in a browser and print/save as PDF.
      attachments: [
        {
          filename: `donation-receipt-${receiptNumber}.html`,
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