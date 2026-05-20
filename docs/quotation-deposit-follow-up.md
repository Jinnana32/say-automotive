# Quotation Deposit Follow-up

Quotation partial payments are intentionally not implemented in this batch.

Current safe boundary:

- `payments` are invoice payments only.
- Invoice balances, release rules, payment receipts, and payment reports all rely on that assumption.
- Mixing quotation deposits directly into `payments` would blur whether a payment reduced an issued invoice or only reserved a pending quotation.

Recommended production-safe approach for a later batch:

1. Add a dedicated quotation deposit or customer credit table.
2. Record deposits against a quotation or customer, not against an invoice.
3. When an invoice is created from the approved quotation, explicitly apply the deposit as invoice credit in one transactional flow.
4. Keep separate audit trails for:
   - deposit received
   - deposit applied to invoice
   - deposit refunded or adjusted

Until that model exists, branch-aware invoice payments remain the only supported payment workflow.
