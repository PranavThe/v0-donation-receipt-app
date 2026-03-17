"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Download, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { generateReceiptPDF } from "@/lib/pdf-generator"
import { Spinner } from "@/components/ui/spinner"

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().optional(),
  donationAmount: z.string().min(1, "Donation amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Must be a valid amount greater than 0"
  ),
  donationDate: z.date({ required_error: "Donation date is required" }),
  paymentMethod: z.enum(["Cash", "Check", "Credit Card", "Online/PayPal"]),
  note: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

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

export function DonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      donationAmount: "",
      donationDate: new Date(),
      paymentMethod: "Check",
      note: "",
    },
  })

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      // Save to database
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          donationDate: format(data.donationDate, "yyyy-MM-dd"),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to save receipt")
      }

      // Generate and download PDF
      generateReceiptPDF({
        receiptNumber: result.receipt.receiptNumber,
        donorName: `${data.firstName} ${data.lastName}`,
        donorEmail: data.email,
        donorAddress: data.address,
        donationAmount: parseFloat(data.donationAmount),
        donationDate: data.donationDate,
        paymentMethod: data.paymentMethod,
        note: data.note,
        orgInfo: ORG_INFO,
      })

      // Open email client
      const subject = encodeURIComponent("Donation Receipt – Vedanta Society of Providence")
      const body = encodeURIComponent(
        `Dear ${data.firstName},\n\nThank you for your generous donation to the Vedanta Society of Providence.\n\nPlease find your official donation receipt attached to this email. This receipt may be used for your tax records.\n\nWith gratitude,\n${ORG_INFO.representative}\n${ORG_INFO.title}\nVedanta Society of Providence`
      )
      window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`

      // Reset form after successful submission
      form.reset()
    } catch (error) {
      console.error("Error:", error)
      alert("There was an error processing your request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...form.register("firstName")}
            placeholder="John"
            className="bg-card"
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...form.register("lastName")}
            placeholder="Doe"
            className="bg-card"
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="john@example.com"
            className="bg-card"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="donationAmount">Donation Amount (USD) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="donationAmount"
              {...form.register("donationAmount")}
              placeholder="100.00"
              className="bg-card pl-7"
            />
          </div>
          {form.formState.errors.donationAmount && (
            <p className="text-sm text-destructive">{form.formState.errors.donationAmount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address (Optional)</Label>
        <Input
          id="address"
          {...form.register("address")}
          placeholder="123 Main St, City, State ZIP"
          className="bg-card"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Donation Date *</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-card",
                  !form.watch("donationDate") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("donationDate") ? (
                  format(form.watch("donationDate"), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("donationDate")}
                onSelect={(date) => {
                  form.setValue("donationDate", date || new Date())
                  setCalendarOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.donationDate && (
            <p className="text-sm text-destructive">{form.formState.errors.donationDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Payment Method *</Label>
          <Select
            value={form.watch("paymentMethod")}
            onValueChange={(value: FormData["paymentMethod"]) => form.setValue("paymentMethod", value)}
          >
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Check">Check</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
              <SelectItem value="Online/PayPal">Online/PayPal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note / Purpose (Optional)</Label>
        <Textarea
          id="note"
          {...form.register("note")}
          placeholder="e.g., General Fund, Building Maintenance"
          className="bg-card resize-none"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Processing...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            <Mail className="mr-2 h-4 w-4" />
            Generate & Email Receipt
          </>
        )}
      </Button>
    </form>
  )
}
