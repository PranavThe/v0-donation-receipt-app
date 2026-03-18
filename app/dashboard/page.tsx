import { DonationForm } from "@/components/donation-form"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <Card className="shadow-lg border-border/50">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">Donation Receipt Generator</h2>
            <p className="text-sm text-muted-foreground">
              Fill in the donor details below to generate a tax-deductible donation receipt. Preview updates live as you type.
            </p>
          </div>
          <DonationForm />
        </CardContent>
      </Card>
    </div>
  )
}
