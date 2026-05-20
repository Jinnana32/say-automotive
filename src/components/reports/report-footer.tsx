import { DocumentFooter } from "@/components/reports/document-footer";

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
    <DocumentFooter
      businessName={businessName}
      vatRegistrationNo={vatRegistrationNo}
      contactNumber={contactNumber}
      email={email}
      address={address}
    />
  );
}
