# CelebriPlan AI — GenAI-Powered Celebration & Event Planner
> **Prompt Wars Virtual — Challenge 5 Submission**

CelebriPlan AI is an intelligent, adaptive celebration and event planning assistant that empowers organizers to plan **weddings, birthdays, and community celebrations** with precision. Powered by **Google Gemini 2.0 Flash**, it transforms complex event logistics into a structured, tradeoff-aware blueprint covering itemized budgets, milestone timelines, vendor coordination, and personalized cultural themes.

---

## 🌟 Key Features & Problem Statement Alignment

| Problem Statement Requirement | CelebriPlan AI Implementation |
|---|---|
| **Multi-Persona Event Support** | Full tailored workflows for **Weddings**, **Birthdays**, and **Community Gatherings** with Indian cultural awareness (mehendi, sangeet, haldi, live counters, prasadam). |
| **Smart Budget Planner** | AI-optimized category breakdowns with realistic Indian market estimates, contingency funds, and an interactive **Tradeoff & Cut Simulator**. |
| **Milestone Timeline Generator** | Structured phases from foundation to showtime with task dependencies, deadlines, priority badges, and interactive checkbox tracking. |
| **Vendor Coordinator & Comparator** | AI interview question scripts, red flag warnings, contract checklists, and an interactive **Quotation Comparator** evaluating real quotes against AI benchmarks. |
| **Personalized Ideas & Themes** | 4-pillar event concepts (Decor, Food & Catering, Activities, Music) with pros & cons, per-plate costs, and a **Vibe Customizer**. |
| **Adaptive Replanning Engine** | Dynamically evaluates change impacts (e.g., budget cuts, guest count surges) and rebalances allocations with strategic tradeoffs. |
| **Context-Aware AI Assistant** | Continuous conversational chat loaded with real-time event parameters (budget, guests, priorities, countdown). |

---

## 🤖 GenAI Services Utilized

CelebriPlan AI leverages **Google Gemini AI (`gemini-2.0-flash`)** via the `@google/generative-ai` SDK across 6 dedicated integration points:

1. **Budget Allocation & Tradeoff Modeling (`generateBudgetBreakdown`)**:
   - Dynamically calculates realistic budget distribution across venue, catering, decor, photography, and entertainment based on user priorities and guest count.
2. **Milestone Timeline & Dependency Sequencing (`generateTimeline`)**:
   - Analyzes target event dates and produces sequential phases with prerequisite dependencies and urgent weekly action items.
3. **Vendor Interview Scripts & Risk Evaluation (`generateVendorChecklist`)**:
   - Generates category-specific negotiation strategies, inquiry questions, and contractual red flags tailored to the Indian celebration market.
4. **Cultural Theme & Culinary Curation (`generatePersonalizedIdeas`)**:
   - Curates multi-pillar theme packages with decor elements, live counter suggestions, and cost-effective alternatives.
5. **Adaptive Replanning Engine (`analyzeChangeImpact`)**:
   - Performs tradeoff analysis when constraints change (e.g., budget cuts, guest count increases) and recommends strategic reallocations.
6. **Context-Rich Planning Chat (`chat`)**:
   - Answers freeform planning queries with live event context injected into the system prompt.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
git clone <your-repo-link>
cd celebration-planner
npm install
```

### 3. Configure Gemini API Key
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```
> Alternatively, you can configure your API key directly in the web UI via the **Settings (Key icon)** modal.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🌐 Deployment to Firebase Hosting

This project is pre-configured with `firebase.json` for single-page app hosting on Firebase:

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Login and initialize:
   ```bash
   firebase login
   firebase init hosting
   # Set public directory to "dist" and configure as a single-page app (rewrite all URLs to /index.html)
   ```
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📁 Project Architecture

```
celebration-planner/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ApiKeyModal/    # API Key configuration & storage
│   │   ├── Navbar/         # Responsive navigation & event switcher
│   │   └── Toast/          # Auto-dismissing notification toasts
│   ├── pages/              # Application views
│   │   ├── LandingPage/    # Hero showcase & value proposition
│   │   ├── OnboardingPage/ # Multi-step wizard to initialize event plan
│   │   ├── DashboardPage/  # Event overview & Adaptive Replanner modal
│   │   ├── BudgetPage/     # Itemized budgets & Tradeoff simulator
│   │   ├── TimelinePage/   # Milestone roadmap & interactive task board
│   │   ├── VendorsPage/    # Category guides & Quotation comparator
│   │   ├── IdeasPage/      # Multi-pillar themes & Vibe customizer
│   │   └── ChatPage/       # Interactive Gemini event assistant
│   ├── services/
│   │   ├── eventStore.js   # Local persistence, state management & pub/sub
│   │   └── gemini.js       # Gemini 2.0 Flash service & smart fallback engines
│   ├── App.jsx             # Route definitions & global state listeners
│   ├── index.css           # Design tokens, variables & glassmorphism utilities
│   └── main.jsx            # Application entry point
├── firebase.json           # Firebase Hosting SPA routing & headers
├── package.json            # Dependencies & scripts
└── vite.config.js          # Vite build configuration
```

---

## 🔒 Security & Safe Practices
- **No Hardcoded Secrets**: API keys are never hardcoded in source code; stored securely in environment variables or user session.
- **Client-Side Persistence**: Event plans and chat records reside safely in user's browser `localStorage`.
- **Zero-Crash Resiliency**: Intelligent fallback engines ensure complete interactive functionality even during API rate limits.
