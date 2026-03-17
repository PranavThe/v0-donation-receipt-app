import { OrgHeader } from "@/components/org-header"
import { DonationForm } from "@/components/donation-form"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-5xl shadow-lg border-border/50">
        <CardContent className="p-6 md:p-8 space-y-6">
          <OrgHeader />
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">Donation Receipt Generator</h2>
            <p className="text-sm text-muted-foreground">
              Fill in the donor details below to generate a tax-deductible donation receipt. Preview updates live as you type.
            </p>
          </div>
          <DonationForm />
        </CardContent>
      </Card>
    </main>
  )
}
