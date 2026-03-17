"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Download, Mail, Save } from "lucide-react"
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
import { ReceiptPreview } from "@/components/receipt-preview"

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

interface UserSuggestion {
  id: number
  first_name: string
  last_name: string
  email: string
  address: string | null
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

// ── Autocomplete input ────────────────────────────────────────────────────────
function AutocompleteInput({
  id, field, placeholder, value, onChange, onSelectUser, className,
}: {
  id: string
  field: "firstName" | "lastName" | "email" | "address"
  placeholder: string
  value: string
  onChange: (val: string) => void
  onSelectUser: (user: UserSuggestion) => void
  className?: string
}) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); setOpen(false); return }
    try {
      const res = await fetch(`/api/users/autocomplete?field=${field}&q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const list = data.suggestions || []
      setSuggestions(list)
      setOpen(list.length > 0)
    } catch {
      setSuggestions([])
      setOpen(false)
    }
  }, [field])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200)
  }

  const handleSelect = (user: UserSuggestion) => {
    onSelectUser(user)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault(); handleSelect(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const getDisplayLabel = (user: UserSuggestion) => {
    if (field === "firstName") return user.first_name
    if (field === "lastName") return user.last_name
    if (field === "email") return user.email
    return user.address ?? ""
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {suggestions.map((user, i) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors border-b border-border/50 last:border-0",
                i === activeIndex && "bg-accent"
              )}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(user) }}
            >
              <div className="font-medium text-foreground">{getDisplayLabel(user)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {user.first_name} {user.last_name} · {user.email}
                {user.address ? ` · ${user.address}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function DonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [savedReceipt, setSavedReceipt] = useState<{ receiptNumber: string } | null>(null)

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

  const watchedValues = form.watch()

  // When a suggestion is selected, fill all fields at once
  const handleSelectUser = (user: UserSuggestion) => {
    form.setValue("firstName", user.first_name, { shouldValidate: true })
    form.setValue("lastName", user.last_name, { shouldValidate: true })
    form.setValue("email", user.email, { shouldValidate: true })
    form.setValue("address", user.address ?? "", { shouldValidate: true })
  }

  async function handleSaveAndDownload() {
    const isValid = await form.trigger()
    if (!isValid) return
    const data = form.getValues()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, donationDate: format(data.donationDate, "yyyy-MM-dd") }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to save receipt")
      setSavedReceipt({ receiptNumber: result.receipt.receiptNumber })
      await generateReceiptPDF({
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
    } catch (error) {
      console.error("Error:", error)
      alert("There was an error processing your request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEmailReceipt() {
    if (!savedReceipt) { alert("Please save the receipt first before emailing."); return }
    const data = form.getValues()
    if (!data.email || !data.firstName) { alert("Please fill in at least the name and email fields."); return }
    setIsSendingEmail(true)
    try {
      const pdfBase64 = await generateReceiptPDF({
        receiptNumber: savedReceipt.receiptNumber,
        donorName: `${data.firstName} ${data.lastName}`,
        donorEmail: data.email,
        donorAddress: data.address,
        donationAmount: parseFloat(data.donationAmount),
        donationDate: data.donationDate,
        paymentMethod: data.paymentMethod,
        note: data.note,
        orgInfo: ORG_INFO,
      }, { returnBase64: true })
      const response = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNumber: savedReceipt.receiptNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          donationAmount: data.donationAmount,
          donationDate: format(data.donationDate, "yyyy-MM-dd"),
          pdfBase64,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to send email")
      alert(`Receipt emailed successfully to ${data.email}!`)
    } catch (error) {
      console.error("Email error:", error)
      alert("Failed to send email. Please try again or download the receipt manually.")
    } finally {
      setIsSendingEmail(false)
    }
  }

  function handleReset() {
    form.reset()
    setSavedReceipt(null)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <AutocompleteInput
              id="firstName" field="firstName" placeholder="John"
              value={watchedValues.firstName}
              onChange={(val) => form.setValue("firstName", val, { shouldValidate: true })}
              onSelectUser={handleSelectUser}
              className="bg-card"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <AutocompleteInput
              id="lastName" field="lastName" placeholder="Doe"
              value={watchedValues.lastName}
              onChange={(val) => form.setValue("lastName", val, { shouldValidate: true })}
              onSelectUser={handleSelectUser}
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
            <AutocompleteInput
              id="email" field="email" placeholder="john@example.com"
              value={watchedValues.email}
              onChange={(val) => form.setValue("email", val, { shouldValidate: true })}
              onSelectUser={handleSelectUser}
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
              <Input id="donationAmount" {...form.register("donationAmount")} placeholder="100.00" className="bg-card pl-7" />
            </div>
            {form.formState.errors.donationAmount && (
              <p className="text-sm text-destructive">{form.formState.errors.donationAmount.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address (Optional)</Label>
          <AutocompleteInput
            id="address" field="address" placeholder="123 Main St, City, State ZIP"
            value={watchedValues.address ?? ""}
            onChange={(val) => form.setValue("address", val)}
            onSelectUser={handleSelectUser}
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
                  className={cn("w-full justify-start text-left font-normal bg-card", !form.watch("donationDate") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("donationDate") ? format(form.watch("donationDate"), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("donationDate")}
                  onSelect={(date) => { form.setValue("donationDate", date || new Date()); setCalendarOpen(false) }}
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
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
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
          <Textarea id="note" {...form.register("note")} placeholder="e.g., General Fund, Building Maintenance" className="bg-card resize-none" rows={2} />
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button type="button" onClick={handleSaveAndDownload} disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
            {isSubmitting
              ? <><Spinner className="mr-2 h-4 w-4" />Saving & Generating...</>
              : <><Save className="mr-2 h-4 w-4" /><Download className="mr-2 h-4 w-4" />Save & Download Receipt</>}
          </Button>
          <Button type="button" onClick={handleEmailReceipt} disabled={isSendingEmail} variant="outline" className="w-full" size="lg">
            {isSendingEmail
              ? <><Spinner className="mr-2 h-4 w-4" />Sending...</>
              : <><Mail className="mr-2 h-4 w-4" />Email Receipt to Donor</>}
          </Button>
          {savedReceipt && (
            <Button type="button" onClick={handleReset} variant="ghost" className="w-full text-muted-foreground" size="sm">
              Clear Form & Start New Receipt
            </Button>
          )}
        </div>

        {savedReceipt && (
          <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            Receipt saved! Number: <span className="font-mono font-medium">{savedReceipt.receiptNumber}</span>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <ReceiptPreview
          firstName={watchedValues.firstName}
          lastName={watchedValues.lastName}
          email={watchedValues.email}
          address={watchedValues.address}
          donationAmount={watchedValues.donationAmount}
          donationDate={watchedValues.donationDate}
          paymentMethod={watchedValues.paymentMethod}
          note={watchedValues.note}
          receiptNumber={savedReceipt?.receiptNumber}
        />
      </div>
    </div>
  )
}