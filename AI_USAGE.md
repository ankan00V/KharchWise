# AI Usage Log

This document details the usage of Artificial Intelligence during the development of KharchWise, including the tools utilized, key prompts, and instances where the AI generated incorrect outputs that required correction.

## 1. AI Tool Used
**Google DeepMind Antigravity AI:** Used as an autonomous, agentic pair-programming assistant within the IDE. It has the ability to view files, grep codebases, write code, run terminal commands, and deploy to Vercel/GitHub.

## 2. Key Prompts & Interactions
*   *"fix the cors issues"* — Used to debug network failures between the Railway backend and Vercel frontend.
*   *"make it lag free, fast"* — Used to trigger a major architectural refactor, replacing standard API polling with `swr` caching.
*   *"Also apply loading, animations and skeleton architecture all over the website so that user does not feel stuck when something is loading"* — Used to trigger the creation of a global, animated shimmering skeleton UI.

## 3. Concrete Cases of Incorrect AI Outputs

### Case 1: Logo Alignment Breaking on Login Page
*   **What went wrong:** The AI was tasked with removing padding from the `KharchwiseLogo` component used in the Navbar. To do this, the AI applied a hacky CSS class `h-[200%] origin-left` to scale the image up and push the padding off-screen. While this looked acceptable in the Navbar's left-aligned layout, it completely broke the central alignment on the `Login.tsx` page, causing the logo to violently shift off-center.
*   **How it was caught:** The UI was visually inspected, and the prompt *"wtf, yr why is logo not proprly aligned"* was issued.
*   **What was changed:** The AI recognized the flaw in using `origin-left` for a component reused in centered contexts. It removed the hacky height adjustments and instead used `scale-[1.5]` inside a fixed-size `flex items-center justify-center` container, perfectly cropping the padding while maintaining true center alignment globally.

### Case 2: Un-typed SWR Generics Breaking the CI/CD Pipeline
*   **What went wrong:** When tasked with making the app "lag free," the AI successfully replaced `useState` implementations across 5 different tab files with `useSWR` for advanced caching. However, the AI failed to provide generic types to the `useSWR` hooks (e.g., `const { data: groups } = useSWR('/api/groups', api);`).
*   **How it was caught:** The local development server ran fine, but when the AI pushed the code to GitHub, the strict Vercel CI/CD pipeline failed during `tsc -b && vite build`. TypeScript threw multiple TS7006 and TS18046 errors because `data` implicitly had an `any` or `unknown` type.
*   **What was changed:** The AI ran the build command locally (`npm run build`), parsed the exact compilation errors, and meticulously went back through the 5 files to explicitly type the SWR hooks (e.g., `useSWR<any[]>`). The subsequent push built successfully in 499ms.

### Case 3: Brittle Database Transactions During CSV Import
*   **What went wrong:** Initially, the AI wrote the CSV `importLogic.ts` using a single, massive Prisma `$transaction`. If a 200-row CSV had a single negative number or an unknown user, the entire transaction rolled back and the import failed entirely with a generic 500 error.
*   **How it was caught:** During manual testing of the CSV upload feature, uploading a slightly malformed spreadsheet caused the entire import process to reject.
*   **What was changed:** The architectural approach was redesigned entirely. The AI was instructed to dismantle the single transaction and implement a decoupled **Quarantine Architecture**. Valid rows are now processed normally, while problematic rows are independently inserted into a new `ImportAnomaly` database table, allowing the bulk of the data to succeed while flagging the rest for manual user review.
