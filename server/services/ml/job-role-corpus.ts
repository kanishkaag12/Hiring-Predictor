/**
 * JOB ROLE CORPUS
 * 
 * A comprehensive, background-agnostic corpus of job roles spanning all industries.
 * This corpus enables the ML system to recommend roles for users from ANY background:
 * - Technical (Engineering, IT, Data Science)
 * - Business (Finance, Marketing, Operations)
 * - Creative (Design, Content, Media)
 * - Healthcare (Medical, Research, Care)
 * - Education (Teaching, Administration, Research)
 * - Legal (Law, Compliance, Policy)
 * - Arts & Humanities (Writing, Culture, Social)
 * - Trades & Vocational (Skilled trades, Crafts)
 * 
 * Each role has:
 * - id: Unique identifier
 * - title: Job title
 * - cluster: High-level career cluster
 * - description: What the role involves
 * - keySkills: Skills typically needed
 * - keywords: Terms that would appear in matching resumes
 * - industries: Where this role exists
 */

export interface JobRole {
  id: string;
  title: string;
  cluster: string;
  description: string;
  keySkills: string[];
  keywords: string[];
  industries: string[];
}

export const JOB_ROLE_CLUSTERS = [
  "Engineering & Technology",
  "Data & Analytics",
  "Product & Design",
  "Business & Operations",
  "Marketing & Communications",
  "Sales & Customer Success",
  "Finance & Accounting",
  "Human Resources",
  "Healthcare & Life Sciences",
  "Education & Training",
  "Legal & Compliance",
  "Creative & Media",
  "Research & Academia",
  "Manufacturing & Logistics",
  "Skilled Trades",
  "Public Sector & NGO",
  "Hospitality & Service",
  "Arts & Entertainment"
] as const;

export type JobRoleCluster = typeof JOB_ROLE_CLUSTERS[number];

export const JOB_ROLE_CORPUS: JobRole[] = [
  // ============================================================================
  // ENGINEERING & TECHNOLOGY
  // ============================================================================
  {
    id: "software-engineer",
    title: "Software Engineer",
    cluster: "Engineering & Technology",
    description: "Design, develop, and maintain software applications and systems",
    keySkills: ["Programming", "Problem Solving", "Software Design", "Testing", "Version Control"],
    keywords: ["code", "develop", "software", "programming", "engineer", "application", "debug", "algorithm"],
    industries: ["Technology", "Finance", "Healthcare", "E-commerce", "Startups"]
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    cluster: "Engineering & Technology",
    description: "Build user interfaces and client-side applications for web and mobile",
    keySkills: ["HTML", "CSS", "JavaScript", "React", "UI Development", "Responsive Design"],
    keywords: ["frontend", "ui", "interface", "react", "vue", "angular", "css", "html", "web"],
    industries: ["Technology", "Media", "E-commerce", "Agencies"]
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    cluster: "Engineering & Technology",
    description: "Build server-side logic, APIs, and database integrations",
    keySkills: ["Node.js", "Python", "Java", "Databases", "API Design", "Server Management"],
    keywords: ["backend", "server", "api", "database", "node", "python", "java", "microservices"],
    industries: ["Technology", "Finance", "Enterprise", "SaaS"]
  },
  {
    id: "fullstack-developer",
    title: "Full Stack Developer",
    cluster: "Engineering & Technology",
    description: "Work across both frontend and backend to deliver complete applications",
    keySkills: ["Frontend", "Backend", "Databases", "DevOps Basics", "Full Application Development"],
    keywords: ["fullstack", "full-stack", "frontend", "backend", "end-to-end", "application"],
    industries: ["Startups", "Technology", "Agencies", "Consulting"]
  },
  {
    id: "mobile-developer",
    title: "Mobile Developer",
    cluster: "Engineering & Technology",
    description: "Create applications for iOS and Android mobile platforms",
    keySkills: ["iOS", "Android", "React Native", "Flutter", "Mobile UI", "App Store Deployment"],
    keywords: ["mobile", "ios", "android", "app", "swift", "kotlin", "flutter", "react native"],
    industries: ["Technology", "Consumer Apps", "Gaming", "Fintech"]
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    cluster: "Engineering & Technology",
    description: "Manage infrastructure, CI/CD pipelines, and deployment automation",
    keySkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Infrastructure as Code", "Monitoring"],
    keywords: ["devops", "infrastructure", "deployment", "docker", "kubernetes", "aws", "pipeline", "automation"],
    industries: ["Technology", "Enterprise", "Cloud", "SaaS"]
  },
  {
    id: "cloud-architect",
    title: "Cloud Architect",
    cluster: "Engineering & Technology",
    description: "Design and implement cloud infrastructure and migration strategies",
    keySkills: ["AWS", "Azure", "GCP", "Cloud Architecture", "Security", "Cost Optimization"],
    keywords: ["cloud", "aws", "azure", "gcp", "architecture", "infrastructure", "migration"],
    industries: ["Technology", "Enterprise", "Consulting", "Finance"]
  },
  {
    id: "security-engineer",
    title: "Security Engineer",
    cluster: "Engineering & Technology",
    description: "Protect systems and data from security threats and vulnerabilities",
    keySkills: ["Security Analysis", "Penetration Testing", "Compliance", "Encryption", "Risk Assessment"],
    keywords: ["security", "cybersecurity", "penetration", "vulnerability", "compliance", "encryption"],
    industries: ["Technology", "Finance", "Government", "Healthcare"]
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    cluster: "Engineering & Technology",
    description: "Ensure software quality through testing and quality assurance processes",
    keySkills: ["Testing", "Automation", "Quality Processes", "Bug Tracking", "Test Planning"],
    keywords: ["qa", "testing", "quality", "automation", "test", "bug", "verification"],
    industries: ["Technology", "Finance", "Gaming", "Enterprise"]
  },
  {
    id: "embedded-systems-engineer",
    title: "Embedded Systems Engineer",
    cluster: "Engineering & Technology",
    description: "Develop software for hardware devices and embedded systems",
    keySkills: ["C/C++", "Microcontrollers", "RTOS", "Hardware Integration", "Firmware"],
    keywords: ["embedded", "firmware", "microcontroller", "hardware", "iot", "sensor"],
    industries: ["Electronics", "Automotive", "IoT", "Medical Devices"]
  },

  // ============================================================================
  // DATA & ANALYTICS
  // ============================================================================
  {
    id: "data-analyst",
    title: "Data Analyst",
    cluster: "Data & Analytics",
    description: "Analyze data to provide insights and support business decisions",
    keySkills: ["SQL", "Excel", "Data Visualization", "Statistics", "Reporting"],
    keywords: ["data", "analysis", "sql", "excel", "visualization", "report", "insight", "metrics"],
    industries: ["All Industries"]
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    cluster: "Data & Analytics",
    description: "Build predictive models and extract insights from complex datasets",
    keySkills: ["Python", "Machine Learning", "Statistics", "Deep Learning", "Feature Engineering"],
    keywords: ["data science", "machine learning", "model", "prediction", "python", "algorithm", "ai"],
    industries: ["Technology", "Finance", "Healthcare", "E-commerce", "Research"]
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    cluster: "Data & Analytics",
    description: "Build and deploy machine learning models in production systems",
    keySkills: ["ML Frameworks", "Python", "Model Deployment", "MLOps", "Deep Learning"],
    keywords: ["machine learning", "ml", "tensorflow", "pytorch", "model", "training", "deployment"],
    industries: ["Technology", "AI Startups", "Research", "Enterprise"]
  },
  {
    id: "data-engineer",
    title: "Data Engineer",
    cluster: "Data & Analytics",
    description: "Build and maintain data pipelines and infrastructure",
    keySkills: ["ETL", "Big Data", "SQL", "Data Warehousing", "Pipeline Development"],
    keywords: ["data engineer", "pipeline", "etl", "spark", "hadoop", "warehouse", "data lake"],
    industries: ["Technology", "Finance", "E-commerce", "Enterprise"]
  },
  {
    id: "business-intelligence-analyst",
    title: "Business Intelligence Analyst",
    cluster: "Data & Analytics",
    description: "Create dashboards and reports to drive business intelligence",
    keySkills: ["BI Tools", "SQL", "Dashboard Design", "Business Acumen", "Data Modeling"],
    keywords: ["bi", "business intelligence", "tableau", "power bi", "dashboard", "reporting"],
    industries: ["All Industries"]
  },
  {
    id: "ai-research-scientist",
    title: "AI Research Scientist",
    cluster: "Data & Analytics",
    description: "Conduct research to advance the field of artificial intelligence",
    keySkills: ["Deep Learning", "Research", "Mathematics", "Publications", "Experimentation"],
    keywords: ["ai", "research", "deep learning", "neural network", "nlp", "computer vision"],
    industries: ["Research Labs", "Big Tech", "Academia", "AI Startups"]
  },

  // ============================================================================
  // PRODUCT & DESIGN
  // ============================================================================
  {
    id: "product-manager",
    title: "Product Manager",
    cluster: "Product & Design",
    description: "Define product strategy, roadmap, and guide cross-functional teams",
    keySkills: ["Product Strategy", "User Research", "Roadmapping", "Stakeholder Management", "Analytics"],
    keywords: ["product", "strategy", "roadmap", "feature", "stakeholder", "user", "requirement"],
    industries: ["Technology", "SaaS", "E-commerce", "Fintech"]
  },
  {
    id: "ux-designer",
    title: "UX Designer",
    cluster: "Product & Design",
    description: "Design user experiences and interactions for digital products",
    keySkills: ["User Research", "Wireframing", "Prototyping", "Usability Testing", "Design Thinking"],
    keywords: ["ux", "user experience", "wireframe", "prototype", "usability", "design", "figma"],
    industries: ["Technology", "Agencies", "E-commerce", "Media"]
  },
  {
    id: "ui-designer",
    title: "UI Designer",
    cluster: "Product & Design",
    description: "Create visual interfaces and design systems for applications",
    keySkills: ["Visual Design", "Design Systems", "Typography", "Color Theory", "Figma/Sketch"],
    keywords: ["ui", "visual design", "interface", "figma", "sketch", "design system", "mockup"],
    industries: ["Technology", "Agencies", "Media", "E-commerce"]
  },
  {
    id: "product-designer",
    title: "Product Designer",
    cluster: "Product & Design",
    description: "Own end-to-end design from research to visual implementation",
    keySkills: ["UX", "UI", "Research", "Prototyping", "Design Systems"],
    keywords: ["product design", "ux", "ui", "design", "prototype", "user-centered"],
    industries: ["Technology", "Startups", "SaaS", "E-commerce"]
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    cluster: "Product & Design",
    description: "Create visual content for print and digital media",
    keySkills: ["Adobe Creative Suite", "Typography", "Layout", "Branding", "Illustration"],
    keywords: ["graphic", "design", "visual", "photoshop", "illustrator", "branding", "logo"],
    industries: ["Agencies", "Media", "Marketing", "Publishing"]
  },
  {
    id: "industrial-designer",
    title: "Industrial Designer",
    cluster: "Product & Design",
    description: "Design physical products for manufacturing",
    keySkills: ["CAD", "3D Modeling", "Prototyping", "Materials", "Manufacturing Processes"],
    keywords: ["industrial design", "product design", "cad", "3d", "prototype", "manufacturing"],
    industries: ["Manufacturing", "Consumer Goods", "Automotive", "Electronics"]
  },

  // ============================================================================
  // BUSINESS & OPERATIONS
  // ============================================================================
  {
    id: "business-analyst",
    title: "Business Analyst",
    cluster: "Business & Operations",
    description: "Bridge business needs with technology solutions through analysis",
    keySkills: ["Requirements Gathering", "Process Mapping", "Documentation", "Stakeholder Communication"],
    keywords: ["business analyst", "requirements", "process", "stakeholder", "documentation", "analysis"],
    industries: ["All Industries"]
  },
  {
    id: "operations-manager",
    title: "Operations Manager",
    cluster: "Business & Operations",
    description: "Oversee daily operations and improve operational efficiency",
    keySkills: ["Operations Management", "Process Improvement", "Team Leadership", "Budgeting"],
    keywords: ["operations", "management", "process", "efficiency", "team", "operational"],
    industries: ["All Industries"]
  },
  {
    id: "project-manager",
    title: "Project Manager",
    cluster: "Business & Operations",
    description: "Plan, execute, and deliver projects on time and within budget",
    keySkills: ["Project Planning", "Risk Management", "Team Coordination", "Agile/Scrum", "Budgeting"],
    keywords: ["project", "management", "agile", "scrum", "timeline", "deliverable", "milestone"],
    industries: ["All Industries"]
  },
  {
    id: "management-consultant",
    title: "Management Consultant",
    cluster: "Business & Operations",
    description: "Advise organizations on strategy, operations, and performance",
    keySkills: ["Strategic Thinking", "Problem Solving", "Presentations", "Client Management"],
    keywords: ["consulting", "strategy", "advisory", "client", "recommendation", "improvement"],
    industries: ["Consulting", "Advisory", "Professional Services"]
  },
  {
    id: "supply-chain-manager",
    title: "Supply Chain Manager",
    cluster: "Business & Operations",
    description: "Manage end-to-end supply chain operations and logistics",
    keySkills: ["Supply Chain", "Logistics", "Inventory Management", "Vendor Relations", "Forecasting"],
    keywords: ["supply chain", "logistics", "inventory", "procurement", "vendor", "warehouse"],
    industries: ["Retail", "Manufacturing", "E-commerce", "FMCG"]
  },
  {
    id: "strategy-analyst",
    title: "Strategy Analyst",
    cluster: "Business & Operations",
    description: "Analyze market trends and develop business strategies",
    keySkills: ["Strategic Analysis", "Market Research", "Financial Modeling", "Competitive Analysis"],
    keywords: ["strategy", "analysis", "market", "competitive", "business development"],
    industries: ["Consulting", "Corporate Strategy", "Finance"]
  },

  // ============================================================================
  // MARKETING & COMMUNICATIONS
  // ============================================================================
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    cluster: "Marketing & Communications",
    description: "Develop and execute marketing strategies to drive growth",
    keySkills: ["Marketing Strategy", "Campaign Management", "Analytics", "Brand Management"],
    keywords: ["marketing", "campaign", "brand", "growth", "strategy", "promotion"],
    industries: ["All Industries"]
  },
  {
    id: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    cluster: "Marketing & Communications",
    description: "Execute digital marketing campaigns across online channels",
    keySkills: ["SEO", "SEM", "Social Media", "Email Marketing", "Analytics"],
    keywords: ["digital marketing", "seo", "sem", "social media", "google ads", "analytics"],
    industries: ["Technology", "E-commerce", "Agencies", "Media"]
  },
  {
    id: "content-strategist",
    title: "Content Strategist",
    cluster: "Marketing & Communications",
    description: "Plan and oversee content creation to meet business goals",
    keySkills: ["Content Strategy", "Writing", "SEO", "Editorial Planning", "Analytics"],
    keywords: ["content", "strategy", "editorial", "writing", "blog", "copywriting"],
    industries: ["Media", "Technology", "Agencies", "E-commerce"]
  },
  {
    id: "social-media-manager",
    title: "Social Media Manager",
    cluster: "Marketing & Communications",
    description: "Manage brand presence and engagement on social platforms",
    keySkills: ["Social Media", "Community Management", "Content Creation", "Analytics"],
    keywords: ["social media", "instagram", "twitter", "linkedin", "engagement", "community"],
    industries: ["All Industries"]
  },
  {
    id: "public-relations-specialist",
    title: "Public Relations Specialist",
    cluster: "Marketing & Communications",
    description: "Manage public image and media relations for organizations",
    keySkills: ["Media Relations", "Writing", "Crisis Management", "Event Planning"],
    keywords: ["pr", "public relations", "media", "press", "communications", "reputation"],
    industries: ["All Industries"]
  },
  {
    id: "brand-manager",
    title: "Brand Manager",
    cluster: "Marketing & Communications",
    description: "Develop and maintain brand identity and positioning",
    keySkills: ["Brand Strategy", "Market Research", "Campaign Management", "Creative Direction"],
    keywords: ["brand", "branding", "identity", "positioning", "awareness"],
    industries: ["FMCG", "Consumer Goods", "Retail", "Technology"]
  },

  // ============================================================================
  // SALES & CUSTOMER SUCCESS
  // ============================================================================
  {
    id: "sales-representative",
    title: "Sales Representative",
    cluster: "Sales & Customer Success",
    description: "Generate leads and close deals to drive revenue",
    keySkills: ["Sales", "Negotiation", "CRM", "Prospecting", "Relationship Building"],
    keywords: ["sales", "revenue", "deal", "client", "quota", "pipeline", "closing"],
    industries: ["All Industries"]
  },
  {
    id: "account-manager",
    title: "Account Manager",
    cluster: "Sales & Customer Success",
    description: "Manage client relationships and drive account growth",
    keySkills: ["Account Management", "Client Relations", "Upselling", "Renewals"],
    keywords: ["account", "client", "relationship", "retention", "growth", "renewal"],
    industries: ["Technology", "SaaS", "Agencies", "B2B"]
  },
  {
    id: "customer-success-manager",
    title: "Customer Success Manager",
    cluster: "Sales & Customer Success",
    description: "Ensure customers achieve their goals using the product",
    keySkills: ["Customer Success", "Onboarding", "Retention", "Product Knowledge"],
    keywords: ["customer success", "onboarding", "retention", "churn", "satisfaction"],
    industries: ["SaaS", "Technology", "B2B"]
  },
  {
    id: "business-development-manager",
    title: "Business Development Manager",
    cluster: "Sales & Customer Success",
    description: "Identify and pursue new business opportunities and partnerships",
    keySkills: ["Business Development", "Partnerships", "Negotiation", "Strategy"],
    keywords: ["business development", "partnership", "opportunity", "growth", "expansion"],
    industries: ["All Industries"]
  },

  // ============================================================================
  // FINANCE & ACCOUNTING
  // ============================================================================
  {
    id: "financial-analyst",
    title: "Financial Analyst",
    cluster: "Finance & Accounting",
    description: "Analyze financial data and provide investment recommendations",
    keySkills: ["Financial Modeling", "Excel", "Valuation", "Forecasting", "Analysis"],
    keywords: ["finance", "financial", "analysis", "model", "valuation", "investment"],
    industries: ["Finance", "Investment Banking", "Corporate"]
  },
  {
    id: "accountant",
    title: "Accountant",
    cluster: "Finance & Accounting",
    description: "Manage financial records, reporting, and compliance",
    keySkills: ["Accounting", "Financial Reporting", "Tax", "Audit", "Compliance"],
    keywords: ["accounting", "bookkeeping", "tax", "audit", "financial statements", "gaap"],
    industries: ["All Industries"]
  },
  {
    id: "investment-banker",
    title: "Investment Banker",
    cluster: "Finance & Accounting",
    description: "Advise on mergers, acquisitions, and capital raising",
    keySkills: ["Financial Modeling", "M&A", "Valuation", "Presentations", "Deal Execution"],
    keywords: ["investment banking", "m&a", "ipo", "deal", "capital markets"],
    industries: ["Investment Banking", "Finance"]
  },
  {
    id: "auditor",
    title: "Auditor",
    cluster: "Finance & Accounting",
    description: "Examine financial statements and internal controls",
    keySkills: ["Auditing", "Accounting Standards", "Risk Assessment", "Documentation"],
    keywords: ["audit", "compliance", "internal controls", "assurance", "sox"],
    industries: ["Accounting Firms", "Corporate", "Government"]
  },
  {
    id: "risk-analyst",
    title: "Risk Analyst",
    cluster: "Finance & Accounting",
    description: "Identify and assess financial and operational risks",
    keySkills: ["Risk Assessment", "Financial Analysis", "Modeling", "Compliance"],
    keywords: ["risk", "analysis", "assessment", "compliance", "mitigation"],
    industries: ["Finance", "Banking", "Insurance"]
  },

  // ============================================================================
  // HUMAN RESOURCES
  // ============================================================================
  {
    id: "hr-manager",
    title: "HR Manager",
    cluster: "Human Resources",
    description: "Oversee human resources functions and employee relations",
    keySkills: ["HR Management", "Employee Relations", "Policy", "Compliance", "Leadership"],
    keywords: ["hr", "human resources", "employee", "policy", "management"],
    industries: ["All Industries"]
  },
  {
    id: "recruiter",
    title: "Recruiter",
    cluster: "Human Resources",
    description: "Source, screen, and hire talent for organizations",
    keySkills: ["Sourcing", "Interviewing", "ATS", "Employer Branding", "Negotiation"],
    keywords: ["recruiting", "hiring", "talent acquisition", "sourcing", "interview"],
    industries: ["All Industries"]
  },
  {
    id: "training-development-specialist",
    title: "Training & Development Specialist",
    cluster: "Human Resources",
    description: "Design and deliver employee training programs",
    keySkills: ["Training Design", "Facilitation", "LMS", "Needs Assessment"],
    keywords: ["training", "development", "learning", "workshop", "curriculum"],
    industries: ["All Industries"]
  },

  // ============================================================================
  // HEALTHCARE & LIFE SCIENCES
  // ============================================================================
  {
    id: "registered-nurse",
    title: "Registered Nurse",
    cluster: "Healthcare & Life Sciences",
    description: "Provide patient care and coordinate healthcare services",
    keySkills: ["Patient Care", "Medical Knowledge", "Documentation", "Compassion"],
    keywords: ["nurse", "nursing", "patient", "care", "hospital", "clinical"],
    industries: ["Healthcare", "Hospitals", "Clinics"]
  },
  {
    id: "physician",
    title: "Physician",
    cluster: "Healthcare & Life Sciences",
    description: "Diagnose and treat medical conditions",
    keySkills: ["Medical Diagnosis", "Patient Care", "Clinical Skills", "Communication"],
    keywords: ["doctor", "physician", "medicine", "diagnosis", "treatment", "medical"],
    industries: ["Healthcare", "Hospitals", "Private Practice"]
  },
  {
    id: "clinical-research-associate",
    title: "Clinical Research Associate",
    cluster: "Healthcare & Life Sciences",
    description: "Monitor and coordinate clinical trials",
    keySkills: ["Clinical Trials", "GCP", "Data Collection", "Regulatory Compliance"],
    keywords: ["clinical research", "trial", "cra", "pharmaceutical", "regulatory"],
    industries: ["Pharmaceutical", "Biotech", "CRO"]
  },
  {
    id: "pharmacist",
    title: "Pharmacist",
    cluster: "Healthcare & Life Sciences",
    description: "Dispense medications and provide pharmaceutical care",
    keySkills: ["Pharmacy", "Medication Management", "Patient Counseling", "Regulations"],
    keywords: ["pharmacy", "pharmacist", "medication", "prescription", "drug"],
    industries: ["Healthcare", "Retail Pharmacy", "Hospital"]
  },
  {
    id: "biomedical-engineer",
    title: "Biomedical Engineer",
    cluster: "Healthcare & Life Sciences",
    description: "Design and develop medical devices and equipment",
    keySkills: ["Medical Device Design", "Engineering", "Regulatory", "Testing"],
    keywords: ["biomedical", "medical device", "engineering", "healthcare technology"],
    industries: ["Medical Devices", "Healthcare Technology", "Biotech"]
  },

  // ============================================================================
  // EDUCATION & TRAINING
  // ============================================================================
  {
    id: "teacher",
    title: "Teacher",
    cluster: "Education & Training",
    description: "Educate students and develop learning curricula",
    keySkills: ["Teaching", "Curriculum Development", "Classroom Management", "Assessment"],
    keywords: ["teacher", "teaching", "education", "classroom", "curriculum", "student"],
    industries: ["Education", "Schools", "Training"]
  },
  {
    id: "professor",
    title: "Professor",
    cluster: "Education & Training",
    description: "Teach at university level and conduct research",
    keySkills: ["Teaching", "Research", "Publication", "Mentoring", "Grant Writing"],
    keywords: ["professor", "academia", "university", "research", "lecture", "faculty"],
    industries: ["Higher Education", "Academia"]
  },
  {
    id: "instructional-designer",
    title: "Instructional Designer",
    cluster: "Education & Training",
    description: "Design educational content and learning experiences",
    keySkills: ["Instructional Design", "E-Learning", "LMS", "Content Development"],
    keywords: ["instructional design", "e-learning", "curriculum", "training", "module"],
    industries: ["Education", "Corporate Training", "EdTech"]
  },
  {
    id: "education-administrator",
    title: "Education Administrator",
    cluster: "Education & Training",
    description: "Manage educational institutions and programs",
    keySkills: ["Administration", "Leadership", "Policy", "Budgeting", "Stakeholder Management"],
    keywords: ["administration", "principal", "dean", "education management"],
    industries: ["Education", "Schools", "Universities"]
  },

  // ============================================================================
  // LEGAL & COMPLIANCE
  // ============================================================================
  {
    id: "lawyer",
    title: "Lawyer",
    cluster: "Legal & Compliance",
    description: "Provide legal advice and represent clients",
    keySkills: ["Legal Research", "Litigation", "Contract Law", "Negotiation", "Writing"],
    keywords: ["lawyer", "attorney", "legal", "law", "litigation", "contract"],
    industries: ["Law Firms", "Corporate Legal", "Government"]
  },
  {
    id: "paralegal",
    title: "Paralegal",
    cluster: "Legal & Compliance",
    description: "Support lawyers with legal research and documentation",
    keySkills: ["Legal Research", "Documentation", "Case Management", "Filing"],
    keywords: ["paralegal", "legal assistant", "research", "documentation"],
    industries: ["Law Firms", "Corporate Legal"]
  },
  {
    id: "compliance-officer",
    title: "Compliance Officer",
    cluster: "Legal & Compliance",
    description: "Ensure organizational compliance with laws and regulations",
    keySkills: ["Compliance", "Risk Assessment", "Audit", "Policy Development"],
    keywords: ["compliance", "regulatory", "policy", "audit", "risk"],
    industries: ["Finance", "Healthcare", "All Regulated Industries"]
  },
  {
    id: "contract-manager",
    title: "Contract Manager",
    cluster: "Legal & Compliance",
    description: "Manage contract lifecycle and vendor agreements",
    keySkills: ["Contract Management", "Negotiation", "Risk Assessment", "Vendor Management"],
    keywords: ["contract", "agreement", "vendor", "negotiation", "legal"],
    industries: ["All Industries"]
  },

  // ============================================================================
  // CREATIVE & MEDIA
  // ============================================================================
  {
    id: "copywriter",
    title: "Copywriter",
    cluster: "Creative & Media",
    description: "Write compelling copy for marketing and advertising",
    keySkills: ["Writing", "Creativity", "Brand Voice", "SEO", "Storytelling"],
    keywords: ["copywriting", "writing", "content", "advertising", "creative"],
    industries: ["Advertising", "Marketing", "Media", "Agencies"]
  },
  {
    id: "video-editor",
    title: "Video Editor",
    cluster: "Creative & Media",
    description: "Edit video content for various media platforms",
    keySkills: ["Video Editing", "Adobe Premiere", "Storytelling", "Motion Graphics"],
    keywords: ["video", "editing", "premiere", "after effects", "post-production"],
    industries: ["Media", "Entertainment", "Marketing", "YouTube"]
  },
  {
    id: "photographer",
    title: "Photographer",
    cluster: "Creative & Media",
    description: "Capture images for commercial and artistic purposes",
    keySkills: ["Photography", "Lighting", "Post-Processing", "Composition"],
    keywords: ["photography", "photo", "camera", "editing", "lightroom"],
    industries: ["Media", "Events", "E-commerce", "Journalism"]
  },
  {
    id: "journalist",
    title: "Journalist",
    cluster: "Creative & Media",
    description: "Research, write, and report news and stories",
    keySkills: ["Journalism", "Research", "Writing", "Interviewing", "Fact-Checking"],
    keywords: ["journalism", "reporter", "news", "article", "media", "press"],
    industries: ["Media", "News", "Publishing"]
  },
  {
    id: "animator",
    title: "Animator",
    cluster: "Creative & Media",
    description: "Create animations for film, games, and digital media",
    keySkills: ["Animation", "3D Modeling", "Storytelling", "Motion Graphics"],
    keywords: ["animation", "3d", "motion", "character", "vfx", "maya", "blender"],
    industries: ["Entertainment", "Gaming", "Advertising", "Film"]
  },

  // ============================================================================
  // RESEARCH & ACADEMIA
  // ============================================================================
  {
    id: "research-scientist",
    title: "Research Scientist",
    cluster: "Research & Academia",
    description: "Conduct scientific research and publish findings",
    keySkills: ["Research", "Data Analysis", "Publication", "Grant Writing", "Experimentation"],
    keywords: ["research", "scientist", "laboratory", "experiment", "publication", "phd"],
    industries: ["Academia", "Research Labs", "Pharmaceutical", "Biotech"]
  },
  {
    id: "research-analyst",
    title: "Research Analyst",
    cluster: "Research & Academia",
    description: "Conduct research and analysis in various domains",
    keySkills: ["Research", "Analysis", "Data Collection", "Reporting", "Critical Thinking"],
    keywords: ["research", "analyst", "analysis", "report", "study"],
    industries: ["Think Tanks", "Consulting", "Market Research", "Academia"]
  },

  // ============================================================================
  // MANUFACTURING & LOGISTICS
  // ============================================================================
  {
    id: "production-manager",
    title: "Production Manager",
    cluster: "Manufacturing & Logistics",
    description: "Oversee manufacturing operations and production efficiency",
    keySkills: ["Production Planning", "Quality Control", "Team Management", "Lean Manufacturing"],
    keywords: ["production", "manufacturing", "factory", "operations", "quality"],
    industries: ["Manufacturing", "Automotive", "FMCG"]
  },
  {
    id: "logistics-coordinator",
    title: "Logistics Coordinator",
    cluster: "Manufacturing & Logistics",
    description: "Coordinate transportation and delivery of goods",
    keySkills: ["Logistics", "Transportation", "Inventory", "Coordination", "Documentation"],
    keywords: ["logistics", "shipping", "transportation", "delivery", "warehouse"],
    industries: ["Retail", "E-commerce", "Manufacturing", "3PL"]
  },
  {
    id: "quality-assurance-manager",
    title: "Quality Assurance Manager",
    cluster: "Manufacturing & Logistics",
    description: "Ensure product quality standards are met",
    keySkills: ["Quality Management", "ISO", "Auditing", "Process Improvement"],
    keywords: ["quality", "qa", "iso", "audit", "inspection", "standards"],
    industries: ["Manufacturing", "Pharmaceutical", "Food"]
  },

  // ============================================================================
  // SKILLED TRADES
  // ============================================================================
  {
    id: "electrician",
    title: "Electrician",
    cluster: "Skilled Trades",
    description: "Install and maintain electrical systems",
    keySkills: ["Electrical Systems", "Wiring", "Safety", "Troubleshooting"],
    keywords: ["electrician", "electrical", "wiring", "power", "installation"],
    industries: ["Construction", "Utilities", "Maintenance"]
  },
  {
    id: "plumber",
    title: "Plumber",
    cluster: "Skilled Trades",
    description: "Install and repair plumbing systems",
    keySkills: ["Plumbing", "Pipe Fitting", "Troubleshooting", "Safety"],
    keywords: ["plumber", "plumbing", "pipe", "water", "repair"],
    industries: ["Construction", "Maintenance", "Utilities"]
  },
  {
    id: "carpenter",
    title: "Carpenter",
    cluster: "Skilled Trades",
    description: "Build and repair wooden structures",
    keySkills: ["Carpentry", "Woodworking", "Blueprint Reading", "Construction"],
    keywords: ["carpenter", "carpentry", "wood", "construction", "building"],
    industries: ["Construction", "Furniture", "Renovation"]
  },
  {
    id: "hvac-technician",
    title: "HVAC Technician",
    cluster: "Skilled Trades",
    description: "Install and maintain heating and cooling systems",
    keySkills: ["HVAC Systems", "Refrigeration", "Troubleshooting", "Maintenance"],
    keywords: ["hvac", "heating", "cooling", "air conditioning", "refrigeration"],
    industries: ["Construction", "Maintenance", "Commercial"]
  },
  {
    id: "automotive-technician",
    title: "Automotive Technician",
    cluster: "Skilled Trades",
    description: "Diagnose and repair vehicles",
    keySkills: ["Automotive Repair", "Diagnostics", "Engine", "Electronics"],
    keywords: ["automotive", "mechanic", "car", "vehicle", "repair", "engine"],
    industries: ["Automotive", "Dealerships", "Service Centers"]
  },

  // ============================================================================
  // PUBLIC SECTOR & NGO
  // ============================================================================
  {
    id: "policy-analyst",
    title: "Policy Analyst",
    cluster: "Public Sector & NGO",
    description: "Research and analyze public policies",
    keySkills: ["Policy Analysis", "Research", "Writing", "Stakeholder Engagement"],
    keywords: ["policy", "government", "public", "analysis", "legislation"],
    industries: ["Government", "Think Tanks", "NGO"]
  },
  {
    id: "program-manager-ngo",
    title: "Program Manager (NGO)",
    cluster: "Public Sector & NGO",
    description: "Manage programs and initiatives for non-profits",
    keySkills: ["Program Management", "Fundraising", "Stakeholder Relations", "Impact Assessment"],
    keywords: ["program", "nonprofit", "ngo", "development", "social impact"],
    industries: ["NGO", "Non-Profit", "Social Enterprise"]
  },
  {
    id: "social-worker",
    title: "Social Worker",
    cluster: "Public Sector & NGO",
    description: "Support individuals and communities in need",
    keySkills: ["Case Management", "Counseling", "Advocacy", "Community Outreach"],
    keywords: ["social work", "welfare", "counseling", "community", "support"],
    industries: ["Social Services", "Healthcare", "Government"]
  },

  // ============================================================================
  // HOSPITALITY & SERVICE
  // ============================================================================
  {
    id: "hotel-manager",
    title: "Hotel Manager",
    cluster: "Hospitality & Service",
    description: "Manage hotel operations and guest experience",
    keySkills: ["Hospitality", "Operations Management", "Customer Service", "Team Leadership"],
    keywords: ["hotel", "hospitality", "guest", "management", "front desk"],
    industries: ["Hotels", "Resorts", "Hospitality"]
  },
  {
    id: "restaurant-manager",
    title: "Restaurant Manager",
    cluster: "Hospitality & Service",
    description: "Oversee restaurant operations and staff",
    keySkills: ["Restaurant Operations", "Staff Management", "Customer Service", "Inventory"],
    keywords: ["restaurant", "food service", "hospitality", "dining", "management"],
    industries: ["Restaurants", "Food Service", "Hospitality"]
  },
  {
    id: "event-planner",
    title: "Event Planner",
    cluster: "Hospitality & Service",
    description: "Plan and coordinate events and functions",
    keySkills: ["Event Planning", "Vendor Management", "Budgeting", "Coordination"],
    keywords: ["event", "planning", "wedding", "conference", "coordination"],
    industries: ["Events", "Hospitality", "Corporate"]
  },
  {
    id: "customer-service-representative",
    title: "Customer Service Representative",
    cluster: "Hospitality & Service",
    description: "Assist customers with inquiries and issues",
    keySkills: ["Customer Service", "Communication", "Problem Solving", "CRM"],
    keywords: ["customer service", "support", "help desk", "call center"],
    industries: ["All Industries"]
  },

  // ============================================================================
  // ARTS & ENTERTAINMENT
  // ============================================================================
  {
    id: "actor",
    title: "Actor",
    cluster: "Arts & Entertainment",
    description: "Perform in theatrical, film, or television productions",
    keySkills: ["Acting", "Performance", "Voice", "Improvisation"],
    keywords: ["acting", "actor", "theater", "film", "performance", "drama"],
    industries: ["Entertainment", "Film", "Theater"]
  },
  {
    id: "musician",
    title: "Musician",
    cluster: "Arts & Entertainment",
    description: "Create and perform music",
    keySkills: ["Music Performance", "Composition", "Instrument", "Music Theory"],
    keywords: ["music", "musician", "instrument", "band", "performance", "composition"],
    industries: ["Music", "Entertainment", "Media"]
  },
  {
    id: "fine-artist",
    title: "Fine Artist",
    cluster: "Arts & Entertainment",
    description: "Create visual art for exhibition and sale",
    keySkills: ["Art", "Creativity", "Technique", "Exhibition"],
    keywords: ["art", "artist", "painting", "sculpture", "gallery", "exhibition"],
    industries: ["Art", "Galleries", "Museums"]
  },
  {
    id: "game-designer",
    title: "Game Designer",
    cluster: "Arts & Entertainment",
    description: "Design game mechanics and player experiences",
    keySkills: ["Game Design", "Level Design", "Storytelling", "Prototyping"],
    keywords: ["game", "design", "gameplay", "level", "mechanics", "gaming"],
    industries: ["Gaming", "Entertainment", "Technology"]
  }
];

/**
 * Get roles by cluster
 */
export function getRolesByCluster(cluster: JobRoleCluster): JobRole[] {
  return JOB_ROLE_CORPUS.filter(role => role.cluster === cluster);
}

/**
 * Get all unique clusters
 */
export function getAllClusters(): string[] {
  return [...JOB_ROLE_CLUSTERS];
}

/**
 * Search roles by keyword
 */
export function searchRoles(query: string): JobRole[] {
  const queryLower = query.toLowerCase();
  return JOB_ROLE_CORPUS.filter(role =>
    role.title.toLowerCase().includes(queryLower) ||
    role.description.toLowerCase().includes(queryLower) ||
    role.keywords.some(k => k.includes(queryLower)) ||
    role.keySkills.some(s => s.toLowerCase().includes(queryLower))
  );
}

export default JOB_ROLE_CORPUS;
