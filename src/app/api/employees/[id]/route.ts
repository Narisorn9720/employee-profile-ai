import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/employees/[id] - fetch a specific employee profile with join manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const employee = await db.get(
      `SELECT e.*, m.name as headName 
       FROM employees e 
       LEFT JOIN employees m ON e.headId = m.id 
       WHERE e.id = ?`,
      [employeeId]
    );

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

// PUT /api/employees/[id] - update an existing employee profile with manager checks
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Verify employee exists
    const existing = await db.get('SELECT id FROM employees WHERE id = ?', [employeeId]);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

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

    // Verify email uniqueness (excluding this employee)
    const duplicateEmail = await db.get(
      'SELECT id FROM employees WHERE email = ? AND id != ?',
      [email, employeeId]
    );
    if (duplicateEmail) {
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
      
      // Prevent reporting to self
      if (managerId === employeeId) {
        return NextResponse.json({ error: 'An employee cannot be their own manager.' }, { status: 400 });
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

    // Auto-update avatarUrl if name changed and avatarUrl was not customized
    let employeeAvatar = avatarUrl;
    if (!employeeAvatar || employeeAvatar.includes('dicebear.com/7.x/initials')) {
      employeeAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=7c3aed&fontColor=ffffff`;
    }

    await db.run(
      `UPDATE employees 
       SET name = ?, email = ?, phone = ?, department = ?, jobTitle = ?, role = ?, status = ?, salary = ?, joinDate = ?, bio = ?, avatarUrl = ?, headId = ?
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        department,
        jobTitle,
        role,
        status || 'Active',
        salary ? parseInt(salary) : null,
        joinDate,
        bio || null,
        employeeAvatar,
        managerId,
        employeeId
      ]
    );

    const updatedEmployee = await db.get(
      `SELECT e.*, m.name as headName 
       FROM employees e 
       LEFT JOIN employees m ON e.headId = m.id 
       WHERE e.id = ?`,
      [employeeId]
    );
    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Failed to update employee profile' }, { status: 500 });
  }
}

// DELETE /api/employees/[id] - delete an employee profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const existing = await db.get('SELECT id FROM employees WHERE id = ?', [employeeId]);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await db.run('DELETE FROM employees WHERE id = ?', [employeeId]);
    return NextResponse.json({ message: 'Employee profile deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee profile' }, { status: 500 });
  }
}
