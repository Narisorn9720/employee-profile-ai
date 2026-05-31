'use strict';

import React from 'react';

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  jobTitle: string;
  role: string; // 'User' | 'Superuser' | 'Manager' | 'Admin'
  status: string;
  salary: number | null;
  joinDate: string;
  bio: string | null;
  avatarUrl: string | null;
  headId: number | null;
  headName: string | null; // From JOIN query
}

export const DEPARTMENTS = ['Engineering', 'Design', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations'];
export const STATUSES = ['Active', 'On Leave', 'Inactive'];
export const ROLES = ['User', 'Superuser', 'Manager', 'Admin'] as const;
