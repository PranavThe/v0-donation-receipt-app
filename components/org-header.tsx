import { Building2, Phone, Mail, Globe, FileText } from "lucide-react"

const ORG_INFO = {
  name: "Vedanta Society of Providence",
  address: "227 Angell Street, Providence, Rhode Island 02906, USA",
  phone: "(401) 421-3960",
  email: "providence@rkmm.org",
  website: "vedantaprov.org",
  ein: "05-0385129",
  taxStatus: "501(c)(3) nonprofit",
}

export function OrgHeader() {
  return (
    <div className="text-center space-y-3 pb-6 border-b border-border">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h1 className="text-2xl font-semibold text-foreground tracking-tight text-balance">
        {ORG_INFO.name}
      </h1>
      <p className="text-sm text-muted-foreground">{ORG_INFO.address}</p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {ORG_INFO.phone}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {ORG_INFO.email}
        </span>
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {ORG_INFO.website}
        </span>
      </div>
      <div className="flex justify-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
          <FileText className="w-3 h-3" />
          {ORG_INFO.taxStatus}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground">
          EIN: {ORG_INFO.ein}
        </span>
      </div>
    </div>
  )
}
