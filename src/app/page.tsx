'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Eye, X, Briefcase, Mail, Phone, 
  DollarSign, Calendar, User, Filter, AlertCircle, Loader2,
  CheckCircle2, KeyRound, Sun, Moon, ArrowRight
} from 'lucide-react';
import { Employee, DEPARTMENTS, STATUSES, ROLES } from '@/lib/types';

export default function EmployeeDashboard() {
  // State variables
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modal control
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  
  // Selected employee states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form states
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    jobTitle: '',
    role: 'User',
    status: 'Active',
    salary: '',
    joinDate: new Date().toISOString().split('T')[0],
    bio: '',
    avatarUrl: '',
    headId: '' // Head Is field
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deptFilter && deptFilter !== 'All') params.append('department', deptFilter);
      if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
      
      const response = await fetch(`/api/employees?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee profiles');
      }
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch managers list separately for dropdown options
  const fetchManagersList = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setManagers(data.filter((emp: Employee) => emp.role === 'Manager'));
      }
    } catch (err) {
      console.error('Failed to fetch managers list:', err);
    }
  };

  // Debounced search fetching
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, deptFilter, statusFilter]);

  // Load theme and managers on mount
  useEffect(() => {
    fetchManagersList();

    // Theme initialization
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Sync theme changes with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) errors.name = 'Name is required.';
    
    if (!formState.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    if (!formState.department) errors.department = 'Department is required.';
    if (!formState.jobTitle.trim()) errors.jobTitle = 'Job title is required.';
    if (!formState.role) errors.role = 'System Role is required.';
    if (!formState.joinDate) errors.joinDate = 'Join date is required.';
    
    if (formState.salary && (isNaN(Number(formState.salary)) || Number(formState.salary) < 0)) {
      errors.salary = 'Salary must be a positive number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger modal open for create
  const openCreateModal = () => {
    fetchManagersList(); // Refresh manager choices
    setFormState({
      name: '',
      email: '',
      phone: '',
      department: 'Engineering',
      jobTitle: '',
      role: 'User',
      status: 'Active',
      salary: '',
      joinDate: new Date().toISOString().split('T')[0],
      bio: '',
      avatarUrl: '',
      headId: ''
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  // Trigger modal open for edit
  const openEditModal = (employee: Employee) => {
    fetchManagersList(); // Refresh manager choices
    setSelectedEmployee(employee);
    setFormState({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      jobTitle: employee.jobTitle,
      role: employee.role,
      status: employee.status,
      salary: employee.salary?.toString() || '',
      joinDate: employee.joinDate,
      bio: employee.bio || '',
      avatarUrl: employee.avatarUrl || '',
      headId: employee.headId?.toString() || ''
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Trigger modal open for detail
  const openDetailModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  // Handle Create submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create employee');
      }

      showNotification('Employee profile created successfully!');
      setIsCreateOpen(false);
      fetchEmployees();
      fetchManagersList(); // Refresh dropdown manager options
    } catch (err: any) {
      setFormErrors(prev => ({ ...prev, global: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Update submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update employee');
      }

      showNotification('Employee profile updated successfully!');
      setIsEditOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
      fetchManagersList(); // Refresh dropdown manager options
    } catch (err: any) {
      setFormErrors(prev => ({ ...prev, global: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the profile of ${name}?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete employee');
      }

      showNotification('Employee profile deleted successfully.');
      fetchEmployees();
      fetchManagersList();
      if (selectedEmployee?.id === id) {
        setIsDetailOpen(false);
        setSelectedEmployee(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee profile');
    }
  };

  // Helper to show flash notification
  const showNotification = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Status Badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
            Active
          </span>
        );
      case 'On Leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            On Leave
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/50">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  // System Role Badge styling helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/40">
            Admin
          </span>
        );
      case 'Manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/40">
            Manager
          </span>
        );
      case 'Superuser':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/50 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900/40">
            Superuser
          </span>
        );
      case 'User':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-600 border border-zinc-200/50 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700/40">
            User
          </span>
        );
    }
  };

  // Initial avatar placeholder helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 min-h-screen text-zinc-950 dark:text-zinc-50 font-sans selection:bg-purple-100 dark:selection:bg-purple-950 selection:text-purple-900 dark:selection:text-purple-200 pb-16 transition-colors duration-200">
      
      {/* Header Area */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold tracking-wider">
              EP
            </div>
            <div>
              <h1 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">Employee Profile</h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-none mt-0.5">Corporate Directory Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="h-9 w-9 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Flash Notifications */}
        {successMessage && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="text-purple-600 dark:text-purple-400 shrink-0" size={18} />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 shrink-0" size={18} />
            <span className="text-sm font-medium text-red-900 dark:text-red-200">{error}</span>
          </div>
        )}

        {/* Directory Controls & Search */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, title, email, department, role or manager name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-550 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 dark:focus:border-purple-500 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-1.5">
              <Filter size={14} className="text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All" className="dark:bg-zinc-900">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept} className="dark:bg-zinc-900">{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All" className="dark:bg-zinc-900">All Statuses</option>
                {STATUSES.map(stat => (
                  <option key={stat} value={stat} className="dark:bg-zinc-900">{stat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/75 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Employee & Title</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Department & System Role</th>
                  <th className="py-4 px-4">Head Is (Manager)</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Join Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="text-purple-600 animate-spin" size={24} />
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Loading employee directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-550">
                          <User size={20} />
                        </div>
                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mt-2">No profiles found</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                          We couldn't find any employees matching your search criteria. Try modifying your filters or add a new profile.
                        </p>
                        <button 
                          onClick={openCreateModal}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Plus size={14} />
                          <span>Create New Profile</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr 
                      key={employee.id}
                      className="group hover:bg-zinc-50/40 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {employee.avatarUrl ? (
                            <img
                              src={employee.avatarUrl}
                              alt={employee.name}
                              className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-zinc-200/50 dark:border-zinc-700/50"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-950/20 border border-purple-200/30 dark:border-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm">
                              {getInitials(employee.name)}
                            </div>
                          )}
                          <div>
                            <h4 
                              onClick={() => openDetailModal(employee)}
                              className="font-medium text-sm text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 hover:underline cursor-pointer tracking-tight"
                            >
                              {employee.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal leading-normal">{employee.jobTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Mail size={12} className="text-zinc-400 dark:text-zinc-500" />
                            <a href={`mailto:${employee.email}`} className="hover:underline">{employee.email}</a>
                          </span>
                          {employee.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} className="text-zinc-400 dark:text-zinc-500" />
                              <span className="font-mono text-[11px]">{employee.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{employee.department}</span>
                          {getRoleBadge(employee.role)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {employee.headName ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            <ArrowRight size={12} className="text-purple-500 dark:text-purple-400" />
                            <span>{employee.headName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        {employee.joinDate}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(employee)}
                            title="View Profile Details"
                            className="h-8 w-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(employee)}
                            title="Edit Profile"
                            className="h-8 w-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id, employee.name)}
                            title="Delete Profile"
                            className="h-8 w-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer / Summary */}
          {!loading && employees.length > 0 && (
            <div className="bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 px-6 py-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span>Showing {employees.length} employee{employees.length > 1 ? 's' : ''}</span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">EP System Active</span>
            </div>
          )}
        </div>

      </main>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsCreateOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Create Employee Profile</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Fill out details to register a new employee.</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {formErrors.global && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formErrors.global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                      formErrors.name ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.name && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@company.com"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                      formErrors.email ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formState.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Department *</label>
                  <select
                    name="department"
                    value={formState.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-550"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept} className="dark:bg-zinc-900">{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Job Title *</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formState.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Software Engineer"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                      formErrors.jobTitle ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.jobTitle && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.jobTitle}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">System Role *</label>
                  <select
                    name="role"
                    value={formState.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-555"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role} className="dark:bg-zinc-900">{role}</option>
                    ))}
                  </select>
                  {formErrors.role && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.role}</p>}
                </div>
              </div>

              {/* Head Is (Manager select) Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Head Is (Manager)</label>
                <select
                  name="headId"
                  value={formState.headId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-550"
                >
                  <option value="" className="dark:bg-zinc-900">None (No Manager)</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id} className="dark:bg-zinc-900">
                      {manager.name} ({manager.jobTitle || 'Manager'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Select a supervisor with the system role of "Manager".
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Salary (USD/Year)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <input
                      type="number"
                      name="salary"
                      value={formState.salary}
                      onChange={handleInputChange}
                      placeholder="85000"
                      className={`w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                        formErrors.salary ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    />
                  </div>
                  {formErrors.salary && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.salary}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Join Date *</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={formState.joinDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-555 ${
                      formErrors.joinDate ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.joinDate && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.joinDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Status *</label>
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-550"
                >
                  {STATUSES.map(stat => (
                    <option key={stat} value={stat} className="dark:bg-zinc-900">{stat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Short Bio / Notes</label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formState.bio}
                  onChange={handleInputChange}
                  placeholder="Short background summary or career description..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all resize-none dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Custom Photo URL (Optional)</label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formState.avatarUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all"
                />
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">
                  Leave empty to automatically generate a initials avatar.
                </p>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm animate-none"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => {
              setIsEditOpen(false);
              setSelectedEmployee(null);
            }}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Edit Employee Profile</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Modify information for {selectedEmployee.name}.</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedEmployee(null);
                }}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {formErrors.global && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formErrors.global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                      formErrors.name ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.name && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@company.com"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                      formErrors.email ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formState.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Department *</label>
                  <select
                    name="department"
                    value={formState.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-550"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept} className="dark:bg-zinc-900">{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Job Title *</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formState.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Software Engineer"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                      formErrors.jobTitle ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.jobTitle && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.jobTitle}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">System Role *</label>
                  <select
                    name="role"
                    value={formState.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-555"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role} className="dark:bg-zinc-900">{role}</option>
                    ))}
                  </select>
                  {formErrors.role && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.role}</p>}
                </div>
              </div>

              {/* Head Is (Manager select) Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Head Is (Manager)</label>
                <select
                  name="headId"
                  value={formState.headId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-855 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-550"
                >
                  <option value="" className="dark:bg-zinc-900">None (No Manager)</option>
                  {managers
                    .filter(m => m.id !== selectedEmployee.id) // Filter out the current employee from their manager options
                    .map(manager => (
                      <option key={manager.id} value={manager.id} className="dark:bg-zinc-900">
                        {manager.name} ({manager.jobTitle || 'Manager'})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Select a supervisor with the system role of "Manager".
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Salary (USD/Year)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <input
                      type="number"
                      name="salary"
                      value={formState.salary}
                      onChange={handleInputChange}
                      placeholder="85000"
                      className={`w-full pl-7 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all ${
                        formErrors.salary ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    />
                  </div>
                  {formErrors.salary && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.salary}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Join Date *</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={formState.joinDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-555 ${
                      formErrors.joinDate ? 'border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-950' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  {formErrors.joinDate && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{formErrors.joinDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Status *</label>
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all cursor-pointer text-zinc-950 dark:text-zinc-550"
                >
                  {STATUSES.map(stat => (
                    <option key={stat} value={stat} className="dark:bg-zinc-900">{stat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Short Bio / Notes</label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formState.bio}
                  onChange={handleInputChange}
                  placeholder="Short background summary or career description..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all resize-none dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Custom Photo URL (Optional)</label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formState.avatarUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:bg-white dark:focus:bg-zinc-850 focus:ring-2 focus:ring-purple-600/10 dark:focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all"
                />
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">
                  Leave empty to auto-update based on name change initials.
                </p>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => {
              setIsDetailOpen(false);
              setSelectedEmployee(null);
            }}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Employee Profile Card</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    openEditModal(selectedEmployee);
                  }}
                  className="h-8 px-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedEmployee(null);
                  }}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {selectedEmployee.avatarUrl ? (
                  <img
                    src={selectedEmployee.avatarUrl}
                    alt={selectedEmployee.name}
                    className="h-20 w-20 rounded-full object-cover border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-2xl">
                    {getInitials(selectedEmployee.name)}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">{selectedEmployee.name}</h2>
                    {getStatusBadge(selectedEmployee.status)}
                  </div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{selectedEmployee.jobTitle}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-tight">Employee ID: #{selectedEmployee.id.toString().padStart(4, '0')}</p>
                </div>
              </div>

              {/* Bio Section */}
              {selectedEmployee.bio && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-4">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Biography</span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed font-normal">{selectedEmployee.bio}</p>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                
                <div className="flex gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <Briefcase size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Department</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block">{selectedEmployee.department}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <KeyRound size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">System Role</span>
                    <div className="mt-0.5 block">
                      {getRoleBadge(selectedEmployee.role)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <User size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Head Is (Manager)</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block font-semibold">
                      {selectedEmployee.headName ? selectedEmployee.headName : 'None (No Manager)'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Date of Joining</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block">{selectedEmployee.joinDate}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <DollarSign size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Yearly Salary</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                      {selectedEmployee.salary ? `$${selectedEmployee.salary.toLocaleString()}` : 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <Mail size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Email Address</span>
                    <a href={`mailto:${selectedEmployee.email}`} className="font-medium text-zinc-800 dark:text-zinc-200 hover:text-purple-600 dark:hover:text-purple-400 hover:underline mt-0.5 block truncate max-w-[150px]">
                      {selectedEmployee.email}
                    </a>
                  </div>
                </div>

                {selectedEmployee.phone && (
                  <div className="flex gap-2.5 items-start col-span-2">
                    <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                      <Phone size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Direct Contact</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block font-mono">{selectedEmployee.phone}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDelete(selectedEmployee.id, selectedEmployee.name)}
                className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                <span>Delete Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
