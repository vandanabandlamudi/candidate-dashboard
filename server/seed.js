import pool from './db.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Roles ──────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO roles (name) VALUES
        ('Senior Frontend Engineer'),
        ('Product Manager'),
        ('Data Scientist'),
        ('DevOps Engineer')
      ON CONFLICT (name) DO NOTHING
    `);

    // ── 2. Statuses ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO statuses (id, label, order_index) VALUES
        (1, 'Screening',    0),
        (2, 'Interview R1', 1),
        (3, 'Interview R2', 2),
        (4, 'Interview R3', 3),
        (5, 'Offer',        4),
        (6, 'Rejected',     5)
      ON CONFLICT (label) DO NOTHING
    `);
    // Set next_status_id progression
    await client.query(`
      UPDATE statuses SET next_status_id = 2 WHERE label = 'Screening';
      UPDATE statuses SET next_status_id = 3 WHERE label = 'Interview R1';
      UPDATE statuses SET next_status_id = 4 WHERE label = 'Interview R2';
      UPDATE statuses SET next_status_id = 5 WHERE label = 'Interview R3';
    `);

    // ── 3. Candidates ─────────────────────────────────────────────────────────
    const candidatesData = [
      { name: 'Priya Sharma',   email: 'priya.sharma@email.com',   phone: '+91 98765 43210', role: 'Senior Frontend Engineer', status: 'Interview R1', exp: 6,  title: 'Frontend Engineer',         company: 'Infosys',  applied_date: '2026-02-10', summary: 'Strong React developer with experience building scalable SPAs.' },
      { name: 'Arjun Mehta',    email: 'arjun.mehta@email.com',    phone: '+91 91234 56789', role: 'Product Manager',          status: 'Screening',    exp: 5,  title: 'Associate PM',              company: 'Flipkart', applied_date: '2026-02-15', summary: 'Passionate PM with a track record of launching 0-to-1 features.' },
      { name: 'Riya Nair',      email: 'riya.nair@email.com',      phone: '+91 87654 32109', role: 'Senior Frontend Engineer', status: 'Offer',        exp: 7,  title: 'Senior UI Developer',       company: 'Wipro',    applied_date: '2026-01-20', summary: 'Full-stack leaning frontend engineer with deep expertise in Vue and React.' },
      { name: 'Karan Bose',     email: 'karan.bose@email.com',     phone: '+91 99887 76655', role: 'Data Scientist',           status: 'Rejected',     exp: 3,  title: 'Data Analyst',              company: 'Mu Sigma', applied_date: '2026-01-05', summary: 'Data analyst transitioning to data science.' },
      { name: 'Sneha Iyer',     email: 'sneha.iyer@email.com',     phone: '+91 80001 23456', role: 'Data Scientist',           status: 'Interview R1', exp: 5,  title: 'ML Engineer',               company: 'Ola',      applied_date: '2026-02-28', summary: 'Experienced ML engineer with NLP specialization.' },
      { name: 'Vikram Patel',   email: 'vikram.patel@email.com',   phone: '+91 95555 66677', role: 'DevOps Engineer',          status: 'Screening',    exp: 4,  title: 'Cloud Engineer',            company: 'HCL',      applied_date: '2026-03-01', summary: 'Cloud-native engineer with strong Kubernetes and CI/CD expertise.' },
      { name: 'Meera Krishnan', email: 'meera.k@email.com',        phone: '+91 77788 99900', role: 'Product Manager',          status: 'Interview R1', exp: 8,  title: 'Senior PM',                 company: 'Swiggy',   applied_date: '2026-02-05', summary: 'Senior PM with consumer product experience at hyper-growth startups.' },
      { name: 'Rahul Gupta',    email: 'rahul.gupta@email.com',    phone: '+91 88900 11223', role: 'DevOps Engineer',          status: 'Offer',        exp: 6,  title: 'DevOps Lead',               company: 'Razorpay', applied_date: '2026-01-15', summary: 'Seasoned DevOps lead who built and managed infra for a high-traffic payments platform.' },
      { name: 'Ananya Reddy',   email: 'ananya.reddy@email.com',   phone: '+91 73344 55566', role: 'Senior Frontend Engineer', status: 'Screening',    exp: 4,  title: 'Software Engineer II',      company: 'Zomato',   applied_date: '2026-03-10', summary: 'Engineer with a strong focus on component libraries and testing.' },
      { name: 'Nikhil Desai',   email: 'nikhil.desai@email.com',   phone: '+91 90012 34567', role: 'Data Scientist',           status: 'Screening',    exp: 2,  title: 'Junior Data Scientist',     company: "BYJU'S",   applied_date: '2026-03-05', summary: 'Early-career data scientist with a strong stats background.' },
      { name: 'Divya Joshi',    email: 'divya.joshi@email.com',    phone: '+91 82233 44455', role: 'Product Manager',          status: 'Rejected',     exp: 3,  title: 'Business Analyst',          company: 'TCS',      applied_date: '2026-01-25', summary: 'BA with PM aspirations. Good grasp of product concepts.' },
      { name: 'Saurabh Tiwari', email: 'saurabh.tiwari@email.com', phone: '+91 96677 88899', role: 'DevOps Engineer',          status: 'Interview R1', exp: 5,  title: 'Site Reliability Engineer', company: 'PhonePe',  applied_date: '2026-02-20', summary: 'SRE with strong scripting skills and observability experience.' },
    ];

    for (const c of candidatesData) {
      await client.query(`
        INSERT INTO candidates (name, email, phone, role_id, status_id, exp, title, company, applied_date, summary)
        SELECT $1, $2, $3,
          (SELECT id FROM roles WHERE name = $4),
          (SELECT id FROM statuses WHERE label = $5),
          $6, $7, $8, $9, $10
        ON CONFLICT (email) DO NOTHING
      `, [c.name, c.email, c.phone, c.role, c.status, c.exp, c.title, c.company, c.applied_date, c.summary]);
    }

    // ── 4. Questions ──────────────────────────────────────────────────────────
    const questions = [
      // Senior Frontend Engineer
      { id: 'fe1',  role: 'Senior Frontend Engineer', text: 'Explain the virtual DOM and how React uses it to optimize rendering.',                                           type: 'open-ended' },
      { id: 'fe2',  role: 'Senior Frontend Engineer', text: 'What is the difference between useMemo and useCallback?',                                                        type: 'open-ended' },
      { id: 'fe3',  role: 'Senior Frontend Engineer', text: 'How would you implement code splitting in a React application?',                                                  type: 'open-ended' },
      { id: 'fe4',  role: 'Senior Frontend Engineer', text: 'Which hook is used to run a side effect after every render?',                                                     type: 'mcq' },
      { id: 'fe5',  role: 'Senior Frontend Engineer', text: 'What is the CSS box model?',                                                                                     type: 'open-ended' },
      { id: 'fe6',  role: 'Senior Frontend Engineer', text: 'Explain the difference between CSS Grid and Flexbox.',                                                            type: 'open-ended' },
      { id: 'fe7',  role: 'Senior Frontend Engineer', text: 'What are Web Workers and when would you use them?',                                                               type: 'open-ended' },
      { id: 'fe8',  role: 'Senior Frontend Engineer', text: 'How does TypeScript improve large-scale JavaScript development?',                                                 type: 'open-ended' },
      { id: 'fe9',  role: 'Senior Frontend Engineer', text: 'What is the purpose of the key prop in React lists?',                                                             type: 'open-ended' },
      { id: 'fe10', role: 'Senior Frontend Engineer', text: 'Describe how you would optimise a slow React component.',                                                         type: 'open-ended' },
      { id: 'fe11', role: 'Senior Frontend Engineer', text: 'What is GraphQL and how does it differ from REST?',                                                               type: 'open-ended' },
      { id: 'fe12', role: 'Senior Frontend Engineer', text: 'Which of the following is NOT a valid React hook?',                                                               type: 'mcq' },
      { id: 'fe13', role: 'Senior Frontend Engineer', text: 'Explain the concept of tree shaking in webpack.',                                                                 type: 'open-ended' },
      { id: 'fe14', role: 'Senior Frontend Engineer', text: 'What is the Intersection Observer API used for?',                                                                 type: 'open-ended' },
      { id: 'fe15', role: 'Senior Frontend Engineer', text: 'How would you handle global state in a large React app without Redux?',                                           type: 'open-ended' },
      // Product Manager
      { id: 'pm1',  role: 'Product Manager', text: 'How do you prioritise features on a product roadmap?',                                                                    type: 'open-ended' },
      { id: 'pm2',  role: 'Product Manager', text: 'Describe a product you have managed from 0 to 1.',                                                                        type: 'open-ended' },
      { id: 'pm3',  role: 'Product Manager', text: 'What metrics would you track for a new onboarding flow?',                                                                 type: 'open-ended' },
      { id: 'pm4',  role: 'Product Manager', text: 'Which framework is commonly used for product prioritisation?',                                                             type: 'mcq' },
      { id: 'pm5',  role: 'Product Manager', text: 'How would you conduct a competitive analysis?',                                                                           type: 'open-ended' },
      { id: 'pm6',  role: 'Product Manager', text: 'What is the difference between OKRs and KPIs?',                                                                           type: 'open-ended' },
      { id: 'pm7',  role: 'Product Manager', text: 'How do you handle disagreements between engineering and design?',                                                          type: 'open-ended' },
      { id: 'pm8',  role: 'Product Manager', text: 'Describe how you would run an A/B test.',                                                                                 type: 'open-ended' },
      { id: 'pm9',  role: 'Product Manager', text: 'What is a north-star metric and how do you choose one?',                                                                  type: 'open-ended' },
      { id: 'pm10', role: 'Product Manager', text: 'How would you define the MVP for a new feature?',                                                                         type: 'open-ended' },
      { id: 'pm11', role: 'Product Manager', text: 'What does RICE stand for in product prioritisation?',                                                                      type: 'mcq' },
      { id: 'pm12', role: 'Product Manager', text: 'How do you gather and incorporate user feedback?',                                                                         type: 'open-ended' },
      { id: 'pm13', role: 'Product Manager', text: 'Describe a time you had to kill a feature you championed.',                                                                type: 'open-ended' },
      { id: 'pm14', role: 'Product Manager', text: 'What is a product spec and what does it contain?',                                                                         type: 'open-ended' },
      { id: 'pm15', role: 'Product Manager', text: 'How do you measure the success of a launched feature?',                                                                   type: 'open-ended' },
      // Data Scientist
      { id: 'ds1',  role: 'Data Scientist', text: 'What is the difference between supervised and unsupervised learning?',                                                      type: 'open-ended' },
      { id: 'ds2',  role: 'Data Scientist', text: 'Explain overfitting and how you would prevent it.',                                                                        type: 'open-ended' },
      { id: 'ds3',  role: 'Data Scientist', text: 'What is the bias-variance tradeoff?',                                                                                      type: 'open-ended' },
      { id: 'ds4',  role: 'Data Scientist', text: 'Which algorithm is best suited for classification with imbalanced classes?',                                               type: 'mcq' },
      { id: 'ds5',  role: 'Data Scientist', text: 'How would you handle missing data in a dataset?',                                                                          type: 'open-ended' },
      { id: 'ds6',  role: 'Data Scientist', text: 'Explain the difference between precision and recall.',                                                                     type: 'open-ended' },
      { id: 'ds7',  role: 'Data Scientist', text: 'What is cross-validation and why is it important?',                                                                        type: 'open-ended' },
      { id: 'ds8',  role: 'Data Scientist', text: 'Describe how gradient boosting works.',                                                                                    type: 'open-ended' },
      { id: 'ds9',  role: 'Data Scientist', text: 'What is NLP and what are common preprocessing steps?',                                                                     type: 'open-ended' },
      { id: 'ds10', role: 'Data Scientist', text: 'How would you deploy a machine learning model to production?',                                                             type: 'open-ended' },
      { id: 'ds11', role: 'Data Scientist', text: 'What does the ROC-AUC score measure?',                                                                                     type: 'mcq' },
      { id: 'ds12', role: 'Data Scientist', text: 'Explain the concept of feature importance.',                                                                               type: 'open-ended' },
      { id: 'ds13', role: 'Data Scientist', text: 'What is regularisation and when would you use L1 vs L2?',                                                                  type: 'open-ended' },
      { id: 'ds14', role: 'Data Scientist', text: 'How do you evaluate a clustering model?',                                                                                  type: 'open-ended' },
      { id: 'ds15', role: 'Data Scientist', text: 'What is the difference between bagging and boosting?',                                                                     type: 'open-ended' },
      // DevOps Engineer
      { id: 'dv1',  role: 'DevOps Engineer', text: 'What is the difference between Docker and a virtual machine?',                                                            type: 'open-ended' },
      { id: 'dv2',  role: 'DevOps Engineer', text: 'Explain the concept of infrastructure as code.',                                                                          type: 'open-ended' },
      { id: 'dv3',  role: 'DevOps Engineer', text: 'How does Kubernetes handle container orchestration?',                                                                     type: 'open-ended' },
      { id: 'dv4',  role: 'DevOps Engineer', text: 'Which tool is used for declarative infrastructure provisioning on AWS?',                                                  type: 'mcq' },
      { id: 'dv5',  role: 'DevOps Engineer', text: 'What is a CI/CD pipeline and what are its stages?',                                                                       type: 'open-ended' },
      { id: 'dv6',  role: 'DevOps Engineer', text: 'How would you monitor a production Kubernetes cluster?',                                                                  type: 'open-ended' },
      { id: 'dv7',  role: 'DevOps Engineer', text: 'What is GitOps and how does it differ from traditional deployment?',                                                      type: 'open-ended' },
      { id: 'dv8',  role: 'DevOps Engineer', text: 'Explain blue-green deployments.',                                                                                        type: 'open-ended' },
      { id: 'dv9',  role: 'DevOps Engineer', text: 'How do you manage secrets in a Kubernetes environment?',                                                                  type: 'open-ended' },
      { id: 'dv10', role: 'DevOps Engineer', text: 'What is a service mesh and when would you use one?',                                                                      type: 'open-ended' },
      { id: 'dv11', role: 'DevOps Engineer', text: 'What does SRE stand for?',                                                                                               type: 'mcq' },
      { id: 'dv12', role: 'DevOps Engineer', text: 'Describe how you would set up log aggregation for microservices.',                                                        type: 'open-ended' },
      { id: 'dv13', role: 'DevOps Engineer', text: 'What is Terraform state and why is remote state important?',                                                              type: 'open-ended' },
      { id: 'dv14', role: 'DevOps Engineer', text: 'How would you implement auto-scaling on AWS?',                                                                            type: 'open-ended' },
      { id: 'dv15', role: 'DevOps Engineer', text: 'Explain the difference between rolling update and recreate deployment strategies.',                                       type: 'open-ended' },
    ];

    for (const q of questions) {
      await client.query(`
        INSERT INTO questions (id, role_id, text, type)
        SELECT $1, (SELECT id FROM roles WHERE name = $2), $3, $4
        ON CONFLICT (id) DO NOTHING
      `, [q.id, q.role, q.text, q.type]);
    }

    // ── 5. Candidate skills (stored as JSON array on candidates) ─────────────
    // Add a skills column if not already present, then populate
    await client.query(`
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'
    `);
    const skills = {
      'priya.sharma@email.com':   ['React', 'TypeScript', 'CSS', 'GraphQL'],
      'arjun.mehta@email.com':    ['Roadmapping', 'Agile', 'SQL', 'Figma'],
      'riya.nair@email.com':      ['Vue.js', 'React', 'Node.js', 'Webpack'],
      'karan.bose@email.com':     ['Python', 'ML', 'TensorFlow', 'SQL'],
      'sneha.iyer@email.com':     ['Python', 'PyTorch', 'NLP', 'Spark'],
      'vikram.patel@email.com':   ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
      'meera.k@email.com':        ['OKRs', 'A/B Testing', 'Jira', 'User Research'],
      'rahul.gupta@email.com':    ['Jenkins', 'GitOps', 'GCP', 'Ansible'],
      'ananya.reddy@email.com':   ['React', 'Redux', 'Jest', 'Storybook'],
      'nikhil.desai@email.com':   ['R', 'Python', 'Statistics', 'Tableau'],
      'divya.joshi@email.com':    ['Figma', 'Analytics', 'Scrum', 'PRDs'],
      'saurabh.tiwari@email.com': ['Docker', 'Linux', 'CI/CD', 'Python'],
    };
    for (const [email, skillList] of Object.entries(skills)) {
      await client.query(
        `UPDATE candidates SET skills = $1 WHERE email = $2`,
        [skillList, email]
      );
    }

    await client.query('COMMIT');
    console.log('Seed complete — roles, statuses, candidates, questions and skills inserted.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
