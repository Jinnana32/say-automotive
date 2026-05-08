export function ReportFooter({
  contactNumber,
  email,
  address,
}: {
  contactNumber: string | null;
  email: string | null;
  address: string | null;
}) {
  return (
    <footer className="mt-auto pt-8 text-[9px] text-slate-600">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-[2px] w-20 bg-[#ffd24a]" />
          <div className="mt-2 space-y-1">
            <p>{contactNumber || "Contact number not configured"}</p>
            <p>{email || "Email not configured"}</p>
            <p>{address || "Address not configured"}</p>
          </div>
        </div>
        <div className="flex items-end gap-1">
          <div className="h-7 w-6 skew-x-[-28deg] bg-[#173c99]" />
          <div className="h-5 w-5 skew-x-[-28deg] bg-[#ffd24a]" />
        </div>
      </div>
    </footer>
  );
}
