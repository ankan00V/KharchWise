# AI Usage Log

## AI Tools Used
- Google Antigravity (AGY) as the primary autonomous development collaborator.

## Key Prompts
- "Design tables for User, Group, GroupMembership, Expense, ExpenseSplit, Settlement, ImportAnomaly... explain your reasoning for every structural decision"
- "Based on the assignment context, create a seed script that creates Aisha, Rohan, Priya, Meera, Dev, Sam... do NOT add Dev as a group member"
- "Build an import service that accepts the CSV file via an API endpoint... parses every row and runs a series of detector functions"
- "Create a high-performance, interactive 3D horizontal cylinder carousel showing premium animated bank cards using React and Tailwind V4"

## Concrete Cases of AI Correction

1. **Prisma 7 Deprecation Issue**
   - **What happened:** The AI attempted to set up the latest Prisma (v7), which deprecated `url` inside `schema.prisma` in favor of `prisma.config.ts`.
   - **How it was caught:** The `npx prisma generate` command failed with validation errors.
   - **What was changed:** The AI downgraded Prisma to v5 and restored the `url = env("DATABASE_URL")` configuration to ensure stability and compatibility for the assignment.

2. **Truncated Frontend Code**
   - **What happened:** The user-provided `App.tsx` snippet for the card animation was truncated midway through the back-face logic.
   - **How it was caught:** The AI recognized the abrupt stop at `{/* Card Number */}`.
   - **What was changed:** The AI autonomously reconstructed the rest of the file layout, ensuring all nested `div`s were properly closed and mapping the `details.number`, `details.name`, and `details.cvv` to the JetBrains Mono styled block.

3. **Settlement Target Identification**
   - **What happened:** During the CSV import `SETTLEMENT_MISCLASSIFIED` anomaly check, the logic successfully classified a settlement, but lacked a robust resolution for finding the `to_user_id` when the string contained random whitespace.
   - **How it was caught:** Implementing the strict DB structure highlighted that `to_user_id` is a required integer relation to `User`.
   - **What was changed:** Added dummy mapping placeholders (since exact fuzzy matching logic can be expanded) to ensure the row could still be saved as a Settlement without failing DB foreign key constraints.
