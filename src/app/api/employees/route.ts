import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/employees - list employees with search, filters, and join manager
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT e.*, m.name as headName 
      FROM employees e
      LEFT JOIN employees m ON e.headId = m.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ' AND (e.name LIKE ? OR e.jobTitle LIKE ? OR e.email LIKE ? OR e.department LIKE ? OR e.role LIKE ? OR m.name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (department && department !== 'All') {
      sql += ' AND e.department = ?';
      params.push(department);
    }

    if (status && status !== 'All') {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.id DESC';

    const employees = await db.all(sql, params);
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST /api/employees - create a new employee profile with manager check
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { name, email, phone, department, jobTitle, role, status, salary, joinDate, bio, avatarUrl, headId } = body;

    // Validate required fields
    if (!name || !email || !department || !jobTitle || !role || !joinDate) {
      return NextResponse.json(
        { error: 'Name, email, department, job title, role, and join date are required.' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ['User', 'Superuser', 'Manager', 'Admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected. Must be User, Superuser, Manager, or Admin.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.get('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing) {
      return NextResponse.json(
        { error: 'An employee with this email already exists.' },
        { status: 400 }
      );
    }

    // Process and validate headId (Head Is)
    let managerId: number | null = null;
    if (headId !== undefined && headId !== null && headId !== '' && headId !== 'none') {
      managerId = parseInt(headId.toString());
      if (isNaN(managerId)) {
        return NextResponse.json({ error: 'Invalid manager ID selected.' }, { status: 400 });
      }
      
      // Verify manager exists and has role 'Manager'
      const manager = await db.get('SELECT id, role FROM employees WHERE id = ?', [managerId]);
      if (!manager) {
        return NextResponse.json({ error: 'Selected manager does not exist.' }, { status: 400 });
      }
      if (manager.role !== 'Manager') {
        return NextResponse.json({ error: 'Selected manager must have the system role "Manager".' }, { status: 400 });
      }
    }

    // Default status if not provided
    const employeeStatus = status || 'Active';
    // Generate avatar URL using initials if not provided
    const employeeAvatar = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=7c3aed&fontColor=ffffff`;

    const result = await db.run(
      `INSERT INTO employees (name, email, phone, department, jobTitle, role, status, salary, joinDate, bio, avatarUrl, headId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone || null,
        department,
        jobTitle,
        role,
        employeeStatus,
        salary ? parseInt(salary) : null,
        joinDate,
        bio || null,
        employeeAvatar,
        managerId
      ]
    );

    const newEmployee = await db.get(
      `SELECT e.*, m.name as headName 
       FROM employees e 
       LEFT JOIN employees m ON e.headId = m.id 
       WHERE e.id = ?`,
      [result.lastID]
    );
    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee profile' }, { status: 500 });
  }
}
