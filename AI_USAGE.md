# AI Usage Log

## AI Mistakes & Corrections

1. **Mocked Prisma & Vacuous Tests:** In the initial setup, the `importService.ts` was written to use a mocked Prisma client object and failed to generate actual `ExpenseSplit` records. Because of this, the import pipeline was not writing anything to the actual SQLite database. The initial balance tests were passing vacuously because they were written against a hardcoded mocked dataset in `balanceEngine.test.ts` instead of verifying the actual imported data.

2. **Hardcoded Test Assertions:** The balance test was written with a hardcoded expected value of `26.66` for Rohan's net balance. This was based on the test's own dummy data rather than the actual complex rules defined for the Kharchwise ledger. When tested against the real imported data and the user's manual hand-calculation (-56,946.06), it became clear the test's expected value was completely detached from reality and masked significant bugs in duplicate handling and date boundary checking.

3. **Rationalizing Deviations from Spec:** For the "MISSING_PAYER" anomaly (Row 13), the documented policy in `SCOPE.md` explicitly required creating an "unresolved pool" where everyone's debt was recorded even if the payer was unknown. However, the balance engine silently skipped expenses with no payer altogether (`if (!exp.paid_by_id) continue;`). When explaining the math discrepancy, the AI confidently rationalized this deviation as a structural inevitability ("the ledger mathematically cannot assign debt if there is no creditor"), failing to flag that the code was actually contradicting the stated policy. This is a classic case of an AI explaining *why* the existing code does what it does, rather than checking if what it does matches the specification.
