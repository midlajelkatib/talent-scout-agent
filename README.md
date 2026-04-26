#  AI Talent Scout Agent

An AI-powered talent scouting and engagement agent that takes a Job Description as input, discovers matching candidates, engages them conversationally to assess genuine interest, and outputs a ranked shortlist scored on two dimensions: **Match Score** and **Interest Score**.

🔗 **Live Demo:** https://talent-scout-agent-theta.vercel.app

---

##  What It Does

Recruiters spend hours sifting through profiles and chasing candidate interest. This agent automates the entire pipeline:

1. **JD Parsing** — Extracts required skills, experience, location preference, and role title from any job description
2. **Candidate Discovery & Matching** — Scores each candidate against the JD with full explainability
3. **Conversational Outreach** — Simulates a 5-question chat with each candidate to assess genuine interest
4. **Ranked Shortlist** — Outputs a combined ranked list the recruiter can act on immediately

---

##  Demo Video

👉  [https://drive.google.com/file/d/1i27mxNxptFhAM-6X-FWQSm7lPD4V5ziM/view?usp=sharing]

---

##  Architecture

```
Job Description (Input)
        │
        ▼
┌─────────────────┐
│   JD Parser     │  Extracts: skills, experience, remote, role title
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Candidate       │  Scores each candidate:
│ Matching Engine │  - Skill overlap (50pts)
│                 │  - Experience fit (30pts)
│                 │  - Location match (10pts)
│                 │  - Title alignment (10pts)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Conversational  │  5-question outreach simulation:
│ Outreach Agent  │  - Openness to opportunity
│                 │  - Role alignment
│                 │  - Remote/location fit
│                 │  - Excitement level
│                 │  - Start timeline
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Scoring &       │  Combined Score =
│ Ranking Engine  │  60% Match Score + 40% Interest Score
└────────┬────────┘
         │
         ▼
  Ranked Shortlist (Output)
```

---

##  Scoring Logic

### Match Score (out of 100)
| Factor | Points |
|--------|--------|
| Skill overlap with JD | up to 50 |
| Experience meets requirement | up to 30 |
| Location / remote preference | up to 10 |
| Job title alignment | up to 10 |

### Interest Score (out of 100)
Calculated from 5 conversational questions, each weighted by importance:

| Question | Weight |
|----------|--------|
| Open to new opportunities? | 3x |
| Role alignment | 2x |
| Remote/location fit | 1x |
| Excitement level (1–10) | 3x |
| Start timeline | 2x |

### Combined Score
```
Combined = (Match Score × 0.6) + (Interest Score × 0.4)
```

---

##  Local Setup

### Prerequisites
- Node.js v18 or higher
- npm

### Steps

```bash
# Clone the repository
git clone https://github.com/midlajelkatib/talent-scout-agent.git

# Navigate into the project
cd talent-scout-agent

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.

---

##  Sample Input & Output

### Sample Input (Job Description)
```
We are looking for a Senior React Developer with 4+ years of experience 
in TypeScript, GraphQL, and Node.js. The role is remote-friendly and 
involves building scalable frontend systems.
```

### Sample Output (Ranked Shortlist)

| Rank | Candidate | Match Score | Interest Score | Combined |
|------|-----------|-------------|----------------|---------|
| #1 | Ananya Rao | 92% | 87% | 90% |
| #2 | Priya Sharma | 85% | 93% | 88% |
| #3 | Kiran Bose | 88% | 80% | 85% |

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** Inline CSS with custom design system
- **Deployment:** Vercel
- **AI Logic:** Rule-based scoring engine with conversational simulation

---

##  Project Structure

```
talent-scout/
├── src/
│   ├── App.jsx        # Main agent logic and UI
│   └── main.jsx       # React entry point
├── index.html
├── package.json
└── vite.config.js
```

---

##  Author

**Muhammed Midhilaj** — Built for AI Agent Hackathon 2026
