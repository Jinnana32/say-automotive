export const STATUTORY_DEDUCTION_LABELS = {
  sss: "SSS contribution",
  philhealth: "PhilHealth contribution",
  pagibig: "Pag-IBIG contribution",
} as const;

export const STATUTORY_DEDUCTION_LABEL_LIST = Object.values(STATUTORY_DEDUCTION_LABELS);

export function isStatutoryDeductionLabel(label: string) {
  return STATUTORY_DEDUCTION_LABEL_LIST.includes(
    label as (typeof STATUTORY_DEDUCTION_LABEL_LIST)[number],
  );
}

export function buildStatutoryDeductionLines(params: {
  sssEeAmount: number;
  philhealthEeAmount: number;
  pagibigEeAmount: number;
}) {
  const lines: Array<{ label: string; amount: number }> = [];

  if (params.sssEeAmount > 0) {
    lines.push({ label: STATUTORY_DEDUCTION_LABELS.sss, amount: params.sssEeAmount });
  }

  if (params.philhealthEeAmount > 0) {
    lines.push({
      label: STATUTORY_DEDUCTION_LABELS.philhealth,
      amount: params.philhealthEeAmount,
    });
  }

  if (params.pagibigEeAmount > 0) {
    lines.push({
      label: STATUTORY_DEDUCTION_LABELS.pagibig,
      amount: params.pagibigEeAmount,
    });
  }

  return lines;
}

export function resolveEffectiveStatutoryAmounts(params: {
  useBranchDefaults: boolean;
  profileAmounts: {
    sssEeAmount: number;
    philhealthEeAmount: number;
    pagibigEeAmount: number;
  } | null;
  branchDefaults: {
    sssEeAmount: number;
    philhealthEeAmount: number;
    pagibigEeAmount: number;
  };
}) {
  if (!params.profileAmounts || params.useBranchDefaults) {
    return params.branchDefaults;
  }

  return params.profileAmounts;
}
