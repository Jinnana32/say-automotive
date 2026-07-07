const PRINT_FOOTER_DETAILS = {
  businessAddress: [
    "SAY AUTO CARE CENTER",
    "VAT Reg. No.: 244-205-707",
    "39 Guzman St., Mandurriao, Iloilo City",
  ],
  contact: ["09171864070", "09171890758", "(033) 327-1285"],
  email: ["sayautomotivecare@gmail.com"],
  websiteFacebook: ["sayautocare.com", "SAY Auto Care Center / Mags & Tires"],
};

export function DocumentFooter(_props: {
  businessName: string;
  vatRegistrationNo: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
}) {
  return (
    <footer className="pt-2">
      <div className="border-t-2 border-brand-red bg-white pt-2">
        <div className="grid grid-cols-[minmax(0,1.32fr)_minmax(0,0.72fr)_minmax(0,1.02fr)_minmax(0,1.12fr)] text-[9.6px] font-medium leading-[1.24] text-slate-700">
          <FooterSection
            heading="Business / Address"
            icon={<MapPinIcon />}
            value={PRINT_FOOTER_DETAILS.businessAddress}
            emphasizeFirstLine
          />
          <FooterSection
            heading="Contact"
            icon={<PhoneIcon />}
            value={PRINT_FOOTER_DETAILS.contact}
          />
          <FooterSection
            heading="Email"
            icon={<MailIcon />}
            value={PRINT_FOOTER_DETAILS.email}
            textClassName="break-all text-[9px]"
          />
          <FooterSection
            heading="Online"
            icon={<GlobeIcon />}
            value={PRINT_FOOTER_DETAILS.websiteFacebook}
            lineIcons={[<GlobeIcon key="website" />, <FacebookIcon key="facebook" />]}
            textClassName="whitespace-nowrap text-[8.7px]"
          />
        </div>
      </div>
      <div className="mt-1.5 h-[1.5px] bg-brand-navy" />
    </footer>
  );
}

function FooterSection({
  heading,
  icon,
  value,
  emphasizeFirstLine = false,
  lineIcons,
  textClassName,
}: {
  heading: string;
  icon: React.ReactNode;
  value: string[];
  emphasizeFirstLine?: boolean;
  lineIcons?: React.ReactNode[];
  textClassName?: string;
}) {
  return (
    <div className="min-w-0 border-l border-slate-200 px-2 first:border-l-0 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1.5 text-brand-navy">
        <span className="flex size-[14px] shrink-0 items-center justify-center">
          {icon}
        </span>
        <p className="font-semibold uppercase tracking-[0.14em]">
          {heading}
        </p>
      </div>
      <div className="mt-1 space-y-0 text-slate-900">
        {value.map((line, index) => (
          <div key={line} className="flex min-w-0 items-start gap-1.5">
            {lineIcons?.[index] ? (
              <span className="mt-[1px] flex size-[11px] shrink-0 items-center justify-center text-brand-navy">
                {lineIcons[index]}
              </span>
            ) : null}
            <p
              className={
                emphasizeFirstLine && index === 0
                  ? "font-display text-[10.4px] font-semibold uppercase tracking-[0.06em] text-brand-navy"
                  : textClassName ?? "break-words"
              }
            >
              {line}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.99-5.52 10.37-7.38 12.03a.94.94 0 0 1-1.24 0C9.52 20.37 4 14.99 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.91.32 1.8.59 2.65a2 2 0 0 1-.45 2.11L8.09 9.64a16 16 0 0 0 6.27 6.27l1.16-1.16a2 2 0 0 1 2.11-.45c.85.27 1.74.47 2.65.59A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.5l.5-4h-4V7a1 1 0 0 1 1-1h3V2Z" />
    </svg>
  );
}
