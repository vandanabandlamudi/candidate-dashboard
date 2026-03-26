import pool from './db.js'

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = [
  'Senior Frontend Engineer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
]

// ── Statuses ──────────────────────────────────────────────────────────────────
const STATUSES = [
  { label: 'Screening',     order_index: 0, next: 'Interview R1' },
  { label: 'Interview R1',  order_index: 1, next: 'Interview R2' },
  { label: 'Interview R2',  order_index: 2, next: 'Interview R3' },
  { label: 'Interview R3',  order_index: 3, next: 'Offer'        },
  { label: 'Offer',         order_index: 4, next: null           },
  { label: 'Rejected',      order_index: 5, next: null           },
]

// ── Questions (open-ended, set 1) ─────────────────────────────────────────────
const QUESTIONS = {
  'Senior Frontend Engineer': [
    { id: 'fe1',  text: 'Explain the difference between controlled and uncontrolled components in React.' },
    { id: 'fe2',  text: 'How does the virtual DOM work, and what are its performance implications?' },
    { id: 'fe3',  text: 'Describe your approach to optimising a React app that has slow re-renders.' },
    { id: 'fe4',  text: 'What are React hooks? Explain useCallback vs useMemo with an example.' },
    { id: 'fe5',  text: 'How do you handle global state in large React applications? Compare Redux, Context, and Zustand.' },
    { id: 'fe6',  text: 'Explain CSS specificity and how it affects styling decisions.' },
    { id: 'fe7',  text: 'What is code splitting and how would you implement lazy loading in a React app?' },
    { id: 'fe8',  text: "Walk us through how you'd build an accessible, keyboard-navigable dropdown component." },
    { id: 'fe9',  text: 'How do you approach cross-browser compatibility issues in your CSS?' },
    { id: 'fe10', text: 'Describe the difference between SSR, SSG, and CSR. When would you choose each?' },
    { id: 'fe11', text: 'How would you detect and fix a memory leak in a React application?' },
    { id: 'fe12', text: "Explain the concept of a render prop and when you'd use it over a custom hook." },
    { id: 'fe13', text: 'What strategies do you use to keep bundle size minimal?' },
    { id: 'fe14', text: 'How do you test React components? Describe your testing pyramid.' },
    { id: 'fe15', text: 'Describe a challenging UI bug you fixed and the debugging approach you used.' },
  ],
  'Product Manager': [
    { id: 'pm1',  text: 'How do you prioritise a backlog when there are competing stakeholder demands?' },
    { id: 'pm2',  text: "Walk us through how you'd define success metrics for a new feature." },
    { id: 'pm3',  text: 'Describe a product you launched from 0 to 1. What was your biggest learning?' },
    { id: 'pm4',  text: 'How do you balance user research insights with data-driven decision making?' },
    { id: 'pm5',  text: 'How would you handle a disagreement between engineering and design on a key product decision?' },
    { id: 'pm6',  text: "Explain how you'd run an A/B test. What are common pitfalls to avoid?" },
    { id: 'pm7',  text: 'How do you write a PRD? What sections do you consider non-negotiable?' },
    { id: 'pm8',  text: 'Describe your approach to setting and communicating OKRs to your team.' },
    { id: 'pm9',  text: 'How do you stay updated on industry trends and incorporate them into your roadmap?' },
    { id: 'pm10', text: "Walk us through a time you had to kill a feature. How did you handle it?" },
    { id: 'pm11', text: 'How do you approach user segmentation for a new product launch?' },
    { id: 'pm12', text: "What's your framework for deciding build vs. buy vs. partner?" },
    { id: 'pm13', text: 'How do you manage a product with technical debt that slows feature delivery?' },
    { id: 'pm14', text: "Describe how you'd approach pricing a new SaaS product." },
    { id: 'pm15', text: 'How do you align cross-functional teams around a shared roadmap?' },
  ],
  'Data Scientist': [
    { id: 'ds1',  text: 'Explain the bias-variance tradeoff and how it affects model selection.' },
    { id: 'ds2',  text: 'How do you handle class imbalance in a classification problem?' },
    { id: 'ds3',  text: 'Describe a time you had to clean a very messy dataset. What was your approach?' },
    { id: 'ds4',  text: "What's the difference between precision and recall? When would you optimise for each?" },
    { id: 'ds5',  text: 'How do you validate that your model generalises well to unseen data?' },
    { id: 'ds6',  text: 'Explain how gradient boosting works at a high level.' },
    { id: 'ds7',  text: 'How do you approach feature engineering for a tabular dataset?' },
    { id: 'ds8',  text: 'What are the key assumptions of linear regression?' },
    { id: 'ds9',  text: "How do you explain a complex model's predictions to a non-technical stakeholder?" },
    { id: 'ds10', text: 'Describe your approach to A/B testing and statistical significance.' },
    { id: 'ds11', text: 'How would you detect data drift in a production ML model?' },
    { id: 'ds12', text: 'What NLP techniques have you used and in what contexts?' },
    { id: 'ds13', text: "Walk us through how you'd build a recommendation system from scratch." },
    { id: 'ds14', text: 'How do you decide when a model is good enough to deploy?' },
    { id: 'ds15', text: 'Describe a project where your analysis directly influenced a business decision.' },
  ],
  'DevOps Engineer': [
    { id: 'dv1',  text: 'Describe your approach to designing a CI/CD pipeline from scratch.' },
    { id: 'dv2',  text: 'How do you manage secrets and credentials in a cloud environment?' },
    { id: 'dv3',  text: 'Explain the difference between blue-green and canary deployments.' },
    { id: 'dv4',  text: 'How would you debug a Kubernetes pod that keeps crashing?' },
    { id: 'dv5',  text: "What's your approach to infrastructure-as-code? Compare Terraform and Pulumi." },
    { id: 'dv6',  text: 'How do you ensure high availability for a production service?' },
    { id: 'dv7',  text: "Describe how you'd implement observability (logs, metrics, traces) for a microservice." },
    { id: 'dv8',  text: 'How do you handle rollback when a deployment causes a production incident?' },
    { id: 'dv9',  text: "What's your strategy for managing costs in a cloud environment?" },
    { id: 'dv10', text: 'How do you approach capacity planning for a growing application?' },
    { id: 'dv11', text: "Explain how you'd set up auto-scaling for a containerised application." },
    { id: 'dv12', text: 'What are your preferred tools for container security scanning?' },
    { id: 'dv13', text: 'How do you manage database migrations in a zero-downtime deployment?' },
    { id: 'dv14', text: 'Describe your experience with service mesh technologies like Istio or Linkerd.' },
    { id: 'dv15', text: 'Walk us through a major outage you helped resolve. What did you learn?' },
  ],
}

// ── Candidates ────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]

const CANDIDATES = [
  { name: 'Priya Sharma',   email: 'priya.sharma@email.com',   phone: '+91 98765 43210', role: 'Senior Frontend Engineer', status: 'Interview R1', exp: 6, title: 'Frontend Engineer',         company: 'Infosys',  appliedDate: TODAY,        summary: 'Strong React developer with experience building scalable SPAs.',                                            skills: ['React', 'TypeScript', 'CSS', 'GraphQL'] },
  { name: 'Arjun Mehta',    email: 'arjun.mehta@email.com',    phone: '+91 91234 56789', role: 'Product Manager',          status: 'Screening',    exp: 5, title: 'Associate PM',              company: 'Flipkart', appliedDate: TODAY,        summary: 'Passionate PM with a track record of launching 0-to-1 features.',                                           skills: ['Roadmapping', 'Agile', 'SQL', 'Figma'] },
  { name: 'Riya Nair',      email: 'riya.nair@email.com',      phone: '+91 87654 32109', role: 'Senior Frontend Engineer', status: 'Offer',        exp: 7, title: 'Senior UI Developer',       company: 'Wipro',    appliedDate: TODAY,        summary: 'Full-stack leaning frontend engineer with deep expertise in Vue and React.',                                  skills: ['Vue.js', 'React', 'Node.js', 'Webpack'] },
  { name: 'Karan Bose',     email: 'karan.bose@email.com',     phone: '+91 99887 76655', role: 'Data Scientist',           status: 'Rejected',     exp: 3, title: 'Data Analyst',              company: 'Mu Sigma', appliedDate: TODAY,        summary: 'Data analyst transitioning to data science.',                                                                skills: ['Python', 'ML', 'TensorFlow', 'SQL'] },
  { name: 'Sneha Iyer',     email: 'sneha.iyer@email.com',     phone: '+91 80001 23456', role: 'Data Scientist',           status: 'Interview R1', exp: 5, title: 'ML Engineer',               company: 'Ola',      appliedDate: TODAY,        summary: 'Experienced ML engineer with NLP specialization.',                                                           skills: ['Python', 'PyTorch', 'NLP', 'Spark'] },
  { name: 'Vikram Patel',   email: 'vikram.patel@email.com',   phone: '+91 95555 66677', role: 'DevOps Engineer',          status: 'Screening',    exp: 4, title: 'Cloud Engineer',            company: 'HCL',      appliedDate: TODAY,        summary: 'Cloud-native engineer with strong Kubernetes and CI/CD expertise.',                                          skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'] },
  { name: 'Meera Krishnan', email: 'meera.k@email.com',        phone: '+91 77788 99900', role: 'Product Manager',          status: 'Interview R1', exp: 8, title: 'Senior PM',                 company: 'Swiggy',   appliedDate: TODAY,        summary: 'Senior PM with consumer product experience at hyper-growth startups.',                                       skills: ['OKRs', 'A/B Testing', 'Jira', 'User Research'] },
  { name: 'Rahul Gupta',    email: 'rahul.gupta@email.com',    phone: '+91 88900 11223', role: 'DevOps Engineer',          status: 'Offer',        exp: 6, title: 'DevOps Lead',               company: 'Razorpay', appliedDate: TODAY,        summary: 'Seasoned DevOps lead who built and managed infra for a high-traffic payments platform.',                     skills: ['Jenkins', 'GitOps', 'GCP', 'Ansible'] },
  { name: 'Ananya Reddy',   email: 'ananya.reddy@email.com',   phone: '+91 73344 55566', role: 'Senior Frontend Engineer', status: 'Screening',    exp: 4, title: 'Software Engineer II',      company: 'Zomato',   appliedDate: TODAY,        summary: 'Engineer with a strong focus on component libraries and testing.',                                           skills: ['React', 'Redux', 'Jest', 'Storybook'] },
  { name: 'Nikhil Desai',   email: 'nikhil.desai@email.com',   phone: '+91 90012 34567', role: 'Data Scientist',           status: 'Screening',    exp: 2, title: 'Junior Data Scientist',     company: "BYJU'S",   appliedDate: TODAY,        summary: 'Early-career data scientist with a strong stats background.',                                               skills: ['R', 'Python', 'Statistics', 'Tableau'] },
  { name: 'Divya Joshi',    email: 'divya.joshi@email.com',    phone: '+91 82233 44455', role: 'Product Manager',          status: 'Rejected',     exp: 3, title: 'Business Analyst',          company: 'TCS',      appliedDate: TODAY,        summary: 'BA with PM aspirations. Good grasp of product concepts.',                                                   skills: ['Figma', 'Analytics', 'Scrum', 'PRDs'] },
  { name: 'Saurabh Tiwari', email: 'saurabh.tiwari@email.com', phone: '+91 96677 88899', role: 'DevOps Engineer',          status: 'Interview R1', exp: 5, title: 'Site Reliability Engineer', company: 'PhonePe',  appliedDate: TODAY,        summary: 'SRE with strong scripting skills and observability experience.',                                             skills: ['Docker', 'Linux', 'CI/CD', 'Python'] },
]

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Roles
    const roleIdMap = {}
    for (const name of ROLES) {
      const res = await client.query(
        `INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [name]
      )
      roleIdMap[name] = res.rows[0].id
    }
    console.log('✓ Roles seeded')

    // 2. Statuses — two-pass: insert first, then link next_status_id
    const statusIdMap = {}
    for (const s of STATUSES) {
      const res = await client.query(
        `INSERT INTO statuses (label, order_index) VALUES ($1, $2)
         ON CONFLICT (label) DO UPDATE SET order_index=EXCLUDED.order_index RETURNING id`,
        [s.label, s.order_index]
      )
      statusIdMap[s.label] = res.rows[0].id
    }
    for (const s of STATUSES) {
      if (s.next) {
        await client.query(
          `UPDATE statuses SET next_status_id=$1 WHERE id=$2`,
          [statusIdMap[s.next], statusIdMap[s.label]]
        )
      }
    }
    console.log('✓ Statuses seeded')

    // 3. Questions (open-ended, set_number=1)
    for (const [role, qs] of Object.entries(QUESTIONS)) {
      const roleId = roleIdMap[role]
      for (const q of qs) {
        await client.query(
          `INSERT INTO questions (id, role_id, text, type, set_number)
           VALUES ($1, $2, $3, 'open-ended', 1)
           ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text`,
          [q.id, roleId, q.text]
        )
      }
    }
    console.log('✓ Questions seeded (60 open-ended questions, set 1)')

    // 4. Candidates
    for (const c of CANDIDATES) {
      await client.query(
        `INSERT INTO candidates (name, email, phone, role_id, status_id, exp, title, company, applied_date, summary, skills)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (email) DO UPDATE SET
           name=EXCLUDED.name, phone=EXCLUDED.phone, role_id=EXCLUDED.role_id,
           status_id=EXCLUDED.status_id, exp=EXCLUDED.exp, title=EXCLUDED.title,
           company=EXCLUDED.company, applied_date=EXCLUDED.applied_date,
           summary=EXCLUDED.summary, skills=EXCLUDED.skills`,
        [
          c.name, c.email, c.phone,
          roleIdMap[c.role], statusIdMap[c.status],
          c.exp, c.title, c.company, c.appliedDate, c.summary, c.skills,
        ]
      )
    }
    console.log('✓ Candidates seeded (12 candidates)')

    await client.query('COMMIT')
    console.log('\n✅ Seed complete!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
