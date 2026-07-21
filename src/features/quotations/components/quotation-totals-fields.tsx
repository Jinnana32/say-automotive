'use client';

import { FieldError } from '@/components/shared/form-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  calculateQuotationDiscountAmount,
  calculateQuotationTaxAmount,
  type QuotationDiscountMode,
} from '@/features/quotations/utils';
import { formatCurrencyNumber, MONEY_INPUT_STEP } from '@/lib/currency';

type FieldErrors = Record<string, string[] | undefined> | undefined;

export function QuotationTotalsFields({
  subtotal,
  discount,
  discountMode,
  taxRate,
  defaultTaxRate,
  fieldErrors,
  discountFieldId = 'discount',
  taxRateFieldId = 'taxRate',
  onDiscountChange,
  onDiscountModeChange,
  onTaxRateChange,
}: {
  subtotal: number;
  discount: string;
  discountMode: QuotationDiscountMode;
  taxRate: string;
  defaultTaxRate: number;
  fieldErrors?: FieldErrors;
  discountFieldId?: string;
  taxRateFieldId?: string;
  onDiscountChange: (value: string) => void;
  onDiscountModeChange: (mode: QuotationDiscountMode) => void;
  onTaxRateChange: (value: string) => void;
}) {
  const discountAmount = calculateQuotationDiscountAmount({
    subtotal,
    discount,
    discountMode,
  });
  const taxAmount = calculateQuotationTaxAmount({
    subtotal,
    discountAmount,
    taxRate,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={discountFieldId} required>
          Discount
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={discountMode === 'fixed' ? 'default' : 'outline'}
            onClick={() => onDiscountModeChange('fixed')}
          >
            Fixed amount (₱)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={discountMode === 'percent' ? 'default' : 'outline'}
            onClick={() => onDiscountModeChange('percent')}
          >
            Percentage (%)
          </Button>
        </div>
        <Input
          id={discountFieldId}
          inputMode="decimal"
          type="number"
          step={discountMode === 'percent' ? '0.01' : MONEY_INPUT_STEP}
          value={discount}
          onChange={(event) => onDiscountChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {discountMode === 'percent'
            ? `Applied discount: ${formatCurrencyNumber(discountAmount)}`
            : 'Enter the discount as a peso amount.'}
        </p>
        <FieldError errors={fieldErrors} name="discount" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={taxRateFieldId} required>
          Tax rate
        </Label>
        <Input
          id={taxRateFieldId}
          inputMode="decimal"
          type="number"
          step="0.01"
          value={taxRate}
          onChange={(event) => onTaxRateChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Tax ({taxRate || '0'}%): {formatCurrencyNumber(taxAmount)}. Branch default is{' '}
          {defaultTaxRate}%.
        </p>
        <FieldError errors={fieldErrors} name="tax" />
      </div>
    </div>
  );
}
