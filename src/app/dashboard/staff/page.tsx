'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { MdArrowBack, MdAdd, MdRefresh, MdPerson, MdCalendarToday, MdCheckCircle, MdCancel, MdAccessTime, MdDelete, MdEdit, MdCalendarMonth } from 'react-icons/md'

interface StaffMember {
    id: string
    name: string
    phone?: string
    role?: string
    salary: number
    joining_date: string
    status: 'active' | 'inactive'
    created_at: string
    photo_url?: string
    half_day_salary?: number
    overtime_rate?: number
}

interface AttendanceRecord {
    id: string
    staff_id: string
    date: string
    status: 'present' | 'absent' | 'half_day' | 'leave'
    check_in?: string
    check_out?: string
    notes?: string
}

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'payroll'>('staff')
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: staffData, error: staffErr } = await supabase
                .from('staff_members')
                .select('*')
                .eq('user_id', session.user.id)
                .order('name')

            if (staffErr) throw staffErr
            setStaff(staffData || [])

            // Fetch attendance for selected month
            const [year, month] = selectedMonth.split('-')
            const startDate = `${year}-${month}-01`
            const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10)

            const { data: attData, error: attErr } = await supabase
                .from('staff_attendance')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('date', startDate)
                .lte('date', endDate)

            if (attErr) throw attErr
            setAttendance(attData || [])
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to fetch staff data'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }, [selectedMonth])

    useEffect(() => {
        fetchData()
    }, [fetchData])



    const handleMarkAttendance = async (staffId: string, date: string, status: AttendanceRecord['status']) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Check if record exists
            const existing = attendance.find(a => a.staff_id === staffId && a.date === date)

            if (existing) {
                const { error } = await supabase
                    .from('staff_attendance')
                    .update({ status })
                    .eq('id', existing.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('staff_attendance')
                    .insert({
                        staff_id: staffId,
                        date,
                        status,
                        user_id: session.user.id
                    })
                if (error) throw error
            }

            toast.success(`Marked ${status}`)
            fetchData()
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to mark attendance'
            toast.error(msg)
        }
    }

    const handleDeleteStaff = async (id: string) => {
        if (!confirm('Delete this staff member?')) return
        try {
            await supabase.from('staff_attendance').delete().eq('staff_id', id)
            const { error } = await supabase.from('staff_members').delete().eq('id', id)
            if (error) throw error
            toast.success('Staff member removed')
            fetchData()
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to delete'
            toast.error(msg)
        }
    }

    // Calculate payroll
    const calculatePayroll = (member: StaffMember) => {
        const [year, month] = selectedMonth.split('-')
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate()
        const perDay = member.salary / daysInMonth

        const records = attendance.filter(a => a.staff_id === member.id)
        const presentDays = records.filter(a => a.status === 'present').length
        const halfDays = records.filter(a => a.status === 'half_day').length
        const absentDays = records.filter(a => a.status === 'absent').length
        const leaveDays = records.filter(a => a.status === 'leave').length

        // Use custom half day amount if provided, else fall back to 50% of per day
        const hPay = (member.half_day_salary && Number(member.half_day_salary) > 0) ? Number(member.half_day_salary) : (perDay * 0.5)
        const payable = Math.round((perDay * (presentDays + leaveDays)) + (hPay * halfDays))

        const effectiveDays = presentDays + (halfDays * 0.5) + leaveDays

        return { presentDays, halfDays, absentDays, leaveDays, effectiveDays, payable, perDay: Math.round(perDay), daysInMonth }
    }

    const today = new Date().toISOString().slice(0, 10)

    if (loading) {
        return (
            <div className="py-40 flex flex-col items-center justify-center gap-4">
                <MdRefresh className="animate-spin text-blue-600 w-10 h-10" />
                <p className="text-slate-500 font-medium">Loading staff data...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <MdArrowBack size={20} className="text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">HR Module</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Staff & Payroll</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Staff Management</h1>
                    </div>
                </div>
                <Link
                    href="/dashboard/staff/add"
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-600/20 active:scale-95 transition-all"
                >
                    <MdAdd size={18} /> Add Staff
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                {(['staff', 'attendance', 'payroll'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                            ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* TAB: Staff List */}
            {activeTab === 'staff' && (
                <div className="space-y-4">
                    {staff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center">
                                <MdPerson size={40} className="text-violet-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase">No Staff Added</h3>
                            <p className="text-slate-500 text-sm max-w-md">Add your employees to start tracking their attendance and calculating payroll.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {staff.map(member => (
                                <div key={member.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/20 overflow-hidden">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                member.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{member.name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                                {member.role && <span className="bg-violet-50 dark:bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">{member.role}</span>}
                                                {member.phone && <span>{member.phone}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Salary</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white italic">₹{member.salary.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/staff/attendance/${member.id}`} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all" title="View Attendance">
                                                <MdCalendarMonth size={18} />
                                            </Link>
                                            <Link href={`/dashboard/staff/edit/${member.id}`} className="p-2.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl transition-all" title="Edit Profile">
                                                <MdEdit size={18} />
                                            </Link>
                                            <button onClick={() => handleDeleteStaff(member.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Delete Staff">
                                                <MdDelete size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Attendance */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white italic uppercase">Today&apos;s Attendance</h2>
                        <p className="text-sm font-bold text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    {staff.length === 0 ? (
                        <p className="text-slate-500 text-center py-12">Add staff members first to mark attendance.</p>
                    ) : (
                        <div className="grid gap-4">
                            {staff.filter(s => s.status === 'active').map(member => {
                                const todayRecord = attendance.find(a => a.staff_id === member.id && a.date === today)
                                return (
                                    <div key={member.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-600 font-black text-lg">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{member.name}</h3>
                                                <p className="text-xs text-slate-400">{member.role || 'Staff'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(['present', 'absent', 'half_day', 'leave'] as const).map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleMarkAttendance(member.id, today, status)}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${todayRecord?.status === status
                                                        ? status === 'present' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                                            : status === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                                : status === 'half_day' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                                                                    : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {status === 'present' && <MdCheckCircle className="inline mr-1" size={14} />}
                                                    {status === 'absent' && <MdCancel className="inline mr-1" size={14} />}
                                                    {status === 'half_day' && <MdAccessTime className="inline mr-1" size={14} />}
                                                    {status === 'leave' && <MdCalendarToday className="inline mr-1" size={14} />}
                                                    {status.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Payroll */}
            {activeTab === 'payroll' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white italic uppercase">Payroll Summary</h2>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300"
                        />
                    </div>

                    {staff.length === 0 ? (
                        <p className="text-slate-500 text-center py-12">Add staff members and mark attendance to see payroll.</p>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800">
                                            <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                                            <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Present</th>
                                            <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Half</th>
                                            <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent</th>
                                            <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave</th>
                                            <th className="text-right px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Day</th>
                                            <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {staff.filter(s => s.status === 'active').map(member => {
                                            const payroll = calculatePayroll(member)
                                            return (
                                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-600 font-bold text-sm">{member.name.charAt(0)}</div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                                                                <p className="text-[10px] text-slate-400">₹{member.salary.toLocaleString('en-IN')}/mo</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center px-4 py-4 font-bold text-green-600">{payroll.presentDays}</td>
                                                    <td className="text-center px-4 py-4 font-bold text-yellow-600">
                                                        {payroll.halfDays}
                                                        {member.half_day_salary && Number(member.half_day_salary) > 0 && (
                                                            <span className="block text-[9px] text-slate-400 font-normal mt-0.5">@ ₹{member.half_day_salary}</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center px-4 py-4 font-bold text-red-500">{payroll.absentDays}</td>
                                                    <td className="text-center px-4 py-4 font-bold text-blue-500">{payroll.leaveDays}</td>
                                                    <td className="text-right px-4 py-4 text-slate-500">₹{payroll.perDay.toLocaleString('en-IN')}</td>
                                                    <td className="text-right px-6 py-4">
                                                        <span className="text-lg font-black text-slate-900 dark:text-white italic">₹{payroll.payable.toLocaleString('en-IN')}</span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-violet-50 dark:bg-violet-500/10">
                                            <td colSpan={6} className="px-6 py-4 text-right text-xs font-black text-violet-600 uppercase tracking-widest">Total Payable</td>
                                            <td className="text-right px-6 py-4">
                                                <span className="text-2xl font-black text-violet-600 italic">
                                                    ₹{staff
                                                        .filter(s => s.status === 'active')
                                                        .reduce((sum, m) => sum + calculatePayroll(m).payable, 0)
                                                        .toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}
