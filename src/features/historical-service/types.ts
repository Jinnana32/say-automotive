export type HistoricalServiceFormItem = {
  key: string;
  itemType: "labor" | "service";
  description: string;
  quantity: string;
  unitPrice: string;
};

export type HistoricalServiceFormValues = {
  vehicleId: string;
  serviceDate: string;
  workPerformed: string;
  customerConcern: string;
  diagnosis: string;
  inspectionNotes: string;
  mileageIn: string;
  mileageOut: string;
  items: HistoricalServiceFormItem[];
};
