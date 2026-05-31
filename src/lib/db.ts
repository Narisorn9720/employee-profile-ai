import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Cache database connection in development to prevent connection leaking
let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.join(process.cwd(), 'database.sqlite');
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON');

  // Initialize schema with jobTitle, role, and headId (referencing manager)
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      department TEXT NOT NULL,
      jobTitle TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      salary INTEGER,
      joinDate TEXT NOT NULL,
      bio TEXT,
      avatarUrl TEXT,
      headId INTEGER REFERENCES employees(id) ON DELETE SET NULL
    )
  `);

  // Check if we need to seed mock data
  const countResult = await dbInstance.get<{ count: number }>('SELECT COUNT(*) as count FROM employees');
  if (countResult && countResult.count === 0) {
    // First insert Managers so other employees can reference them
    const bobResult = await dbInstance.run(
      `INSERT INTO employees (name, email, phone, department, jobTitle, role, status, salary, joinDate, bio, avatarUrl, headId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Bob Smith',
        'bob.smith@company.com',
        '+1 (555) 024-9102',
        'Design',
        'Lead Product Designer',
        'Manager',
        'Active',
        110000,
        '2023-03-22',
        'Bob crafts simple, beautiful design languages for complex products and loves typography.',
        'https://api.dicebear.com/7.x/initials/svg?seed=Bob%20Smith&backgroundColor=a78bfa&fontColor=ffffff',
        null
      ]
    );
    const bobId = bobResult.lastID;

    const charlieResult = await dbInstance.run(
      `INSERT INTO employees (name, email, phone, department, jobTitle, role, status, salary, joinDate, bio, avatarUrl, headId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Charlie Brown',
        'charlie.brown@company.com',
        '+1 (555) 038-1123',
        'HR',
        'HR Specialist',
        'Manager',
        'On Leave',
        85000,
        '2022-09-01',
        'Charlie helps foster a collaborative, diverse, and inclusive workplace culture across all teams.',
        'https://api.dicebear.com/7.x/initials/svg?seed=Charlie%20Brown&backgroundColor=f97316&fontColor=ffffff',
        null
      ]
    );
    const charlieId = charlieResult.lastID;

    // Now insert other employees pointing to managers
    const otherEmployees = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        phone: '+1 (555) 019-2834',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        role: 'Superuser',
        status: 'Active',
        salary: 120000,
        joinDate: '2023-01-15',
        bio: 'Alice is a full-stack developer passionate about building clean user experiences and modern APIs.',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Alice%20Johnson&backgroundColor=7c3aed&fontColor=ffffff',
        headId: bobId
      },
      {
        name: 'Diana Prince',
        email: 'diana.prince@company.com',
        phone: '+1 (555) 047-4958',
        department: 'Marketing',
        jobTitle: 'Head of Marketing',
        role: 'Admin',
        status: 'Active',
        salary: 98000,
        joinDate: '2024-02-10',
        bio: 'Diana leads creative marketing campaigns and growth strategies to increase brand awareness globally.',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Diana%20Prince&backgroundColor=7c3aed&fontColor=ffffff',
        headId: charlieId
      },
      {
        name: 'Evan Wright',
        email: 'evan.wright@company.com',
        phone: '+1 (555) 056-2947',
        department: 'Sales',
        jobTitle: 'Account Executive',
        role: 'User',
        status: 'Inactive',
        salary: 75000,
        joinDate: '2024-05-18',
        bio: 'Evan manages key client accounts and drives regional business expansion and sales goals.',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Evan%20Wright&backgroundColor=a78bfa&fontColor=ffffff',
        headId: bobId
      }
    ];

    for (const emp of otherEmployees) {
      await dbInstance.run(
        `INSERT INTO employees (name, email, phone, department, jobTitle, role, status, salary, joinDate, bio, avatarUrl, headId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [emp.name, emp.email, emp.phone, emp.department, emp.jobTitle, emp.role, emp.status, emp.salary, emp.joinDate, emp.bio, emp.avatarUrl, emp.headId]
      );
    }
  }

  return dbInstance;
}
