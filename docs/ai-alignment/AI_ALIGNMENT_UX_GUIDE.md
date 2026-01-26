# AI Alignment for User-Selected Roles - User Experience Guide

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        HIRING PULSE HERO                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ YOUR CAREER INTERESTS                        [User-Selected]     │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  │ Software         │    │ UI/UX Designer   │    │ (Other role)     │
│  │ Engineer         │    │                  │    │                  │
│  │                  │    │                  │    │                  │
│  │ 🟢 Growing Fit   │    │ ⚪ Early Stage   │    │ 🟢 Strong Fit    │
│  │ 52% alignment    │    │ 28% alignment    │    │ 75% alignment    │
│  │                  │    │                  │    │                  │
│  │ Your Strengths:  │    │ Your Strengths:  │    │ Your Strengths:  │
│  │ ✓ Python         │    │ (none detected)  │    │ ✓ React          │
│  │ ✓ Git            │    │                  │    │ ✓ TypeScript     │
│  │ ✓ Testing        │    │ Growth Areas:    │    │ ✓ Component Arch │
│  │ +2 more          │    │ → Design Systems │    │                  │
│  │                  │    │ → User Research  │    │ Growth Areas:    │
│  │ Growth Areas:    │    │ → Prototyping    │    │ → Advanced CSS   │
│  │ → System Design  │    │                  │    │ → Accessibility  │
│  │ → DSA            │    │ 💡 Your AI       │    │                  │
│  │ → Production     │    │ Guidance:        │    │ 💡 Your AI       │
│  │   Debugging      │    │ This is an       │    │ Guidance:        │
│  │                  │    │ excellent goal!  │    │ Excellent        │
│  │ 💡 Your AI       │    │ Start with       │    │ alignment! Your  │
│  │ Guidance:        │    │ Design Systems   │    │ expertise is     │
│  │ You're on track! │    │ fundamentals     │    │ exactly what     │
│  │ Prioritize       │    │ and explore      │    │ this needs.      │
│  │ System Design    │    │ design thinking. │    │ Focus on         │
│  │ and DSA to       │    │                  │    │ advancing your   │
│  │ strengthen.      │    │                  │    │ expertise level. │
│  │                  │    │                  │    │                  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘
│
│  How AI Alignment Works:
│  ℹ️  We analyze your selected roles using semantic similarity and skill
│     matching. Strong Fit = well-prepared; Growing Fit = on the right
│     track; Early Stage = work toward this goal.
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RECOMMENDED CAREER PATHS                     [AI-Powered]        │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  │ ML Engineer      │    │ Backend Dev      │    │ Data Scientist   │
│  │ Data & Analytics │    │ Engineering      │    │ Data & Analytics │
│  │                  │    │                  │    │                  │
│  │ 54% match        │    │ 41% match        │    │ 41% match        │
│  │ 🟢 Medium        │    │ 🟢 Medium        │    │ 🟢 Medium        │
│  │                  │    │                  │    │                  │
│  │ Your Interest    │    │ (no user select) │    │ (no user select) │
│  │                  │    │                  │    │                  │
│  │ ✓ Python         │    │ ✓ Python         │    │ ✓ Python         │
│  │ ✓ TensorFlow     │    │ ...              │    │ ...              │
│  │ ✓ PyTorch        │    │                  │    │                  │
│  │                  │    │ [explanation]    │    │ [explanation]    │
│  │ [explanation]    │    │                  │    │                  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

## Color Coding

### Alignment Status Badges

```
┌─────────────────────┬──────────────────┬──────────────┐
│ Status              │ Color            │ Appearance   │
├─────────────────────┼──────────────────┼──────────────┤
│ Strong Fit (70%+)   │ Emerald Green    │ 🟢 Solid     │
│ Growing Fit (45-70%)│ Amber/Orange     │ 🟡 Solid     │
│ Early Stage (<45%)  │ Slate Gray       │ ⚪ Solid     │
└─────────────────────┴──────────────────┴──────────────┘
```

### Component Color Mapping

```
Strong Fit:
├─ Background: bg-emerald-500/5 (very light green)
├─ Border: border-emerald-500/20 (subtle green)
├─ Badge: border-emerald-500/50, text-emerald-500
└─ Highlight: from-emerald-500/10 to-emerald-500/5

Growing Fit:
├─ Background: bg-amber-500/5 (very light amber)
├─ Border: border-amber-500/20 (subtle amber)
├─ Badge: border-amber-500/50, text-amber-600
└─ Highlight: from-amber-500/10 to-amber-500/5

Early Stage:
├─ Background: bg-slate-500/5 (very light gray)
├─ Border: border-slate-500/20 (subtle gray)
├─ Badge: border-slate-500/50, text-slate-700
└─ Highlight: bg-card/50 border-border/30
```

## Card Structure

```
┌────────────────────────────────────────┐
│ Role Title                             │
│ ├─ 🟢 Growing Fit    52% alignment    │
│ │                                      │
│ ├─ Your Strengths:                    │
│ │  [✓ Skill 1] [✓ Skill 2] [✓ Skill 3] │
│ │  [+2 more]                           │
│ │                                      │
│ ├─ Growth Areas:                      │
│ │  → Growth Area 1                    │
│ │  → Growth Area 2                    │
│ │  → Growth Area 3                    │
│ │                                      │
│ └─ 💡 Your AI Guidance:               │
│    [Constructive, motivating text     │
│    specific to their situation]        │
└────────────────────────────────────────┘
```

## Interactive Elements

### Badges
- **Strength Badges:** Green, with ✓ prefix (e.g., "✓ Python")
- **Skill Count Badge:** Gray outline (e.g., "+2 more")
- **Status Badge:** Color-coded (Strong/Growing/Early)
- **Alignment %" Metric:** Small, secondary text

### Tooltips (Future)
- Hover over "Your Strengths:" → Show full list
- Hover over "Growth Areas:" → Expand suggestions
- Hover over status badge → Explain what it means

## Empty States

### No Resume Uploaded
```
┌────────────────────────────────────────┐
│ Software Engineer                      │
│ 🟡 Growing Fit    (can't calculate)    │
│                                        │
│ Upload a resume to unlock AI alignment │
│ insights for this role.                │
└────────────────────────────────────────┘
```

### No Interest Roles Selected
```
┌────────────────────────────────────────┐
│ YOUR CAREER INTERESTS                  │
│                                        │
│ You haven't selected any roles yet.    │
│ Go to your profile to add career       │
│ interests and get personalized AI      │
│ alignment insights!                    │
└────────────────────────────────────────┘
```

## Mobile Layout (< 768px)

```
Single column grid (1 col)
┌─────────────────┐
│ Role 1          │
└─────────────────┘
┌─────────────────┐
│ Role 2          │
└─────────────────┘
┌─────────────────┐
│ Role 3          │
└─────────────────┘

Cards are full-width
Font sizes adjusted for readability
Spacing optimized for touch
```

## Tablet Layout (768px - 1024px)

```
Two column grid (2 cols)
┌─────────────────┐  ┌─────────────────┐
│ Role 1          │  │ Role 2          │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ Role 3          │  │ Role 4          │
└─────────────────┘  └─────────────────┘
```

## Desktop Layout (> 1024px)

```
Three column grid (3 cols)
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Role 1   │  │ Role 2   │  │ Role 3   │
└──────────┘  └──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│ Role 4   │  │ Role 5   │
└──────────┘  └──────────┘
```

## User Journey

### Flow 1: Student with Career Interests
```
1. Profile Setup
   └─ Select 2 career interests (Software Engineer, ML Engineer)
   └─ Upload resume with skills (Python, TensorFlow, projects)

2. Dashboard Load
   └─ API calls analyzeRoleAlignment() for each selected role
   └─ Gets alignment status, strengths, growth areas

3. User Sees "Your Career Interests"
   └─ Software Engineer: Growing Fit (55%)
      - Strengths: Python, Problem Solving, Projects
      - Growth: System Design, DSA, Debugging
      - Guidance: "You're on the right track! Focus on System Design..."
   
   └─ ML Engineer: Strong Fit (68%)
      - Strengths: Python, TensorFlow, PyTorch, ML fundamentals
      - Growth: Advanced ML techniques, Production systems
      - Guidance: "Excellent foundation! Deepen your expertise in..."

4. User Action
   └─ Reviews growth areas
   └─ Clicks to learn more (future feature)
   └─ Updates profile with new skills
   └─ Alignment updates automatically
```

### Flow 2: Professional Switching Roles
```
1. Selected Role: Senior Product Manager
   └─ Current role: Product Manager at startup

2. Dashboard Shows
   └─ Growing Fit (58%)
   - Strengths: Product Management, Leadership, Analytics
   - Growth: Strategic Planning, Enterprise Sales, Scaling Teams
   - Guidance: "Solid match for Senior PM. Focus on strategic planning
             and enterprise-scale decision making to strengthen fit."

3. Takes Action
   └─ Enrolls in leadership course (growth area)
   └─ Seeks expanded responsibility
   └─ Tracks progress over time
```

## Accessibility Features

- **Color not only identifier:** Uses icons, text labels, shapes
- **Sufficient contrast:** Green (emerald) on light bg, amber on light bg
- **Readable fonts:** Minimum 10px with good line height
- **Semantic HTML:** Proper heading hierarchy, alt text
- **Keyboard nav:** All interactive elements accessible via Tab
- **Screen reader:** Labels, descriptions for all badges and sections

## Animation & Motion

- **Cards:** Subtle hover scale (1.02x) + shadow on desktop
- **Entrance:** Fade in + subtle slide from top (motion.div)
- **Tooltips:** Fade in on hover (future)
- **Mobile:** Reduced motion for accessibility

```typescript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Card content */}
</motion.div>
```

## Information Architecture

```
Dashboard (main)
├─ Resume Parsing Status (if error)
├─ Hiring Pulse Hero
├─ Your Career Interests ← NEW SECTION
│  ├─ Section Header
│  ├─ Role Cards (grid layout)
│  │  ├─ Role Header + Status
│  │  ├─ Your Strengths
│  │  ├─ Growth Areas
│  │  └─ AI Guidance
│  └─ Help Text
├─ Recommended Career Paths (existing)
│  └─ ...
├─ Career Domain Fit (existing)
├─ Growth Trajectory (existing)
└─ ...
```

## Visual Emphasis

### Primary Information
- Role title (large, bold)
- Alignment status (badge, color-coded)

### Secondary Information
- % alignment (small text)
- Matched skills (badges)
- Growth areas (list with arrows)

### Tertiary Information
- AI guidance (box with explanation)
- Help text (info box at bottom)

## Responsive Typography

```
Desktop (> 1024px)
├─ Role title: text-lg font-semibold
├─ Status label: text-xs font-medium
├─ Section titles: text-sm font-medium
└─ Body text: text-sm

Tablet (768px - 1024px)
├─ Role title: text-base font-semibold
├─ Status label: text-xs font-medium
├─ Section titles: text-xs font-medium
└─ Body text: text-xs

Mobile (< 768px)
├─ Role title: text-sm font-semibold
├─ Status label: text-[10px] font-medium
├─ Section titles: text-xs font-medium
└─ Body text: text-xs
```

## Dark Mode Support

All colors automatically adjust via Tailwind dark mode:
- Green → Darker emerald
- Amber → Darker amber
- Gray → Lighter gray (for contrast on dark bg)
- Text → Automatically inverted

```typescript
className="
  bg-emerald-500/5 dark:bg-emerald-950/20
  text-emerald-700 dark:text-emerald-300
  border-emerald-500/20 dark:border-emerald-900/30
"
```

