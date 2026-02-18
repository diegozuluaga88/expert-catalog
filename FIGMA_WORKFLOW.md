# Figma to Code Workflow: Expert Hub

This document outlines the workflow for adapting designs from Figma to the `expert-hub` codebase, utilizing the existing `Strata Design System`.

## 1. Design Inspection
Since direct MCP integration with Figma is not currently active, we will use a manual inspection workflow:

1.  **Access Figma**: Open the provided Figma link: [Expert Hub Design](https://www.figma.com/design/jOuwROGmb7WojWjVS7DpRU/Expert-Hub?node-id=846-20585&m=dev)
2.  **Dev Mode**: Ensure you are in "Dev Mode" (toggle in Figma) to inspect CSS properties, spacing, and tokens.
3.  **Identify Components**:
    *   Look for existing Strata components (Buttons, Inputs, Cards, etc.).
    *   Note any custom elements that require new components.

## 2. Adaptation Strategy
When implementing a design, follow this priority:

1.  **Use Existing Components**:
    *   Check `packages/strata-ds/src/components` for matching UI elements.
    *   Import them from `strata-design-system`.
    
2.  **Use Design Tokens**:
    *   **Colors**: Use semantic tokens (e.g., `text-primary`, `bg-surface`, `border-default`) found in `src/styles/tokens`.
    *   **Spacing**: Use Tailwind spacing classes (e.g., `p-4`, `gap-2`).
    *   **Typography**: Use Strata typography classes (e.g., `text-display-sm`, `text-body-md`).

3.  **Custom Implementation**:
    *   If a component doesn't exist, build it in `expert-hub/src/components` using Strata atoms.
    *   *Do not* add it to `strata-ds` immediately unless it's clearly a shared primitive.

## 3. MCP Assisted Workflow
To leverage the AI assistant for implementation:

1.  **Share Context**:
    *   Take a **screenshot** of the specific section you want to implement.
    *   Paste the screenshot into the chat.
    *   Provide the **Figma measurements** (e.g., "The card has 16px padding and a 1px border").

2.  **AI Implementation**:
    *   The AI will generate the React code using `strata-design-system` components.
    *   It will map hex codes to the nearest Strata tokens.

## 4. Git Workflow
The project is initialized as a Git repository.

1.  **Branching**: `git checkout -b feature/feature-name`
2.  **Committing**: `git commit -m "feat: implemented X component from Figma"`
3.  **Pushing**: `git push origin feature/feature-name` (Requires remote repo URL)

---
**Repository Location**: `strata-projects/config-evolution/expert-hub`
**Design System**: `packages/strata-ds` (Internal Copy) / `Strata Design System` (Source of Truth)
