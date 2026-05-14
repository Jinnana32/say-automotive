export function ReportFooter({
  businessName,
  vatRegistrationNo,
  contactNumber,
  email,
  address,
}: {
  businessName: string;
  vatRegistrationNo: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
}) {
  return (
    <footer className="mt-auto pt-5">
      <div className="border-t-2 border-brand-red pt-3">
        <div className="grid gap-4 px-1 text-[10px] text-slate-700 sm:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))]">
          <div className="min-w-[170px]">
            <p className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-navy">
              {businessName}
            </p>
            <p className="mt-1.5 text-[9.5px] font-medium text-slate-600">
              VAT Reg. No.: {vatRegistrationNo?.trim() || "Not configured"}
            </p>
          </div>
          <FooterDetail label="Contact" value={contactNumber} />
          <FooterDetail label="Email" value={email} />
          <FooterDetail label="Address" value={address} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between bg-brand-navy px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white">
        <span>{businessName}</span>
        <span className="h-[3px] w-14 bg-brand-red" />
      </div>
    </footer>
  );
}

function FooterDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="font-semibold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 break-words text-slate-900">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}
