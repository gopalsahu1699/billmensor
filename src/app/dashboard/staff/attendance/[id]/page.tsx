'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
    MdArrowBack,
    MdCalendarMonth,
    MdCheckCircle,
    MdCancel,
    MdAccessTime,
    MdEventAvailable,
    MdRefresh,
    MdChevronLeft,
    MdChevronRight,
    MdDownload,
    MdShare
} from 'react-icons/md'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface StaffMember {
    id: string
    name: string
    role?: string
    salary: number
}

interface AttendanceRecord {
    id: string
    date: string
    status: 'present' | 'absent' | 'half_day' | 'leave'
}

export default function StaffAttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: staffId } = use(params)
    const [staff, setStaff] = useState<StaffMember | null>(null)
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    })

    const generatePDFFile = async (): Promise<File> => {
        const element = document.getElementById('attendance-report')
        if (!element) throw new Error('Report element not found')

        const styleNodes = document.querySelectorAll('style, link[rel="stylesheet"]')
        let styles = ''
        styleNodes.forEach((node) => {
            if (node.tagName === 'LINK') {
                const href = node.getAttribute('href')
                if (href) {
                    const absoluteUrl = new URL(href, window.location.href).href
                    styles += `<link rel="stylesheet" href="${absoluteUrl}">\n`
                }
            } else {
                styles += node.outerHTML + '\n'
            }
        })

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                ${styles}
                <style>
                    body { background: white !important; margin: 0; padding: 20px; font-family: 'Inter', sans-serif; }
                    #attendance-report { box-shadow: none !important; border: none !important; }
                </style>
            </head>
            <body class="bg-white">
                <div style="width: 1024px; max-width: 1024px; margin: 0 auto;">
                    ${element.outerHTML}
                </div>
            </body>
            </html>
        `

        const response = await fetch('/api/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                html: htmlContent,
                filename: `Attendance_${staff?.name}_${selectedMonth}.pdf`
            })
        })

        if (!response.ok) throw new Error('Server PDF Failed')

        const blob = await response.blob()
        return new File([blob], `Attendance_${staff?.name}_${selectedMonth}.pdf`, { type: 'application/pdf' })
    }

    const handleDownloadPDF = async () => {
        toast.loading('Generating Perfect Web PDF...', { id: 'pdf-generation' })
        try {
            const file = await generatePDFFile()
            const url = window.URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            a.click()
            window.URL.revokeObjectURL(url)
            toast.success('PDF Downloaded!', { id: 'pdf-generation' })
        } catch (error) {
            console.error(error)
            toast.error('Failed using Server PDF. Please use Ctrl+P to "Save as PDF".', { id: 'pdf-generation' })
        }
    }

    const handleShare = async () => {
        if (!navigator.share) {
            return toast.error('Web Share not supported in this browser')
        }

        toast.loading('Preparing PDF to share...', { id: 'pdf-share' })
        try {
            const file = await generatePDFFile()

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                toast.dismiss('pdf-share')
                await navigator.share({
                    files: [file],
                    title: `${staff?.name} Attendance - ${selectedMonth}`,
                    text: `Attached is the attendance report for ${staff?.name} for ${selectedMonth}.`
                })
            } else {
                toast.error('Sharing files is not supported on this device. Please download instead.', { id: 'pdf-share' })
            }
        } catch (error) {
            console.error('Share cancelled or failed', error)
            toast.error('Failed to share PDF. It might be too large or not supported.', { id: 'pdf-share' })
        }
    }

    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true)
            const { data: staffData, error: staffErr } = await supabase
                .from('staff_members')
                .select('id, name, role, salary')
                .eq('id', staffId)
                .single()

            if (staffErr) throw staffErr
            setStaff(staffData)

            const [year, month] = selectedMonth.split('-')
            const startDate = `${year}-${month}-01`
            const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10)

            const { data, error } = await supabase
                .from('staff_attendance')
                .select('*')
                .eq('staff_id', staffId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true })

            if (error) throw error
            setRecords(data || [])
        } catch (error) {
            console.error(error)
            toast.error('Failed to load attendance')
        } finally {
            setLoading(false)
        }
    }, [staffId, selectedMonth])

    useEffect(() => {
        fetchAttendance()
    }, [fetchAttendance])

    const getDaysInMonth = () => {
        const [year, month] = selectedMonth.split('-')
        return new Date(Number(year), Number(month), 0).getDate()
    }

    const stats = {
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        half_day: records.filter(r => r.status === 'half_day').length,
        leave: records.filter(r => r.status === 'leave').length,
    }

    if (loading && !staff) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#020617]">
                <MdRefresh className="animate-spin text-[#7c3aed] w-12 h-12" />
                <p className="text-[#64748b] font-bold uppercase tracking-widest text-xs">Fetching Records...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20 bg-slate-50 dark:bg-[#020617]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 mb-10">
                <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard/staff"
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all active:scale-90"
                        >
                            <MdArrowBack size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Attendance Log</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase leading-none">{staff?.name}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                        <button
                            onClick={handleShare}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all active:scale-90"
                            title="Share Link"
                        >
                            <MdShare size={20} />
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-violet-600 border border-violet-500 text-white hover:bg-violet-500 transition-all active:scale-90 shadow-lg shadow-violet-600/20"
                            title="Download PDF"
                        >
                            <MdDownload size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div id="attendance-report" className="max-w-5xl mx-auto px-6 space-y-10 py-10 bg-white">
                {/* PDF Header - Professional Branding */}
                <div style={{ borderColor: '#7c3aed' }} className="flex flex-col md:flex-row md:items-end justify-between border-b-4 pb-8 gap-6">
                    <div>
                        <h2 style={{ color: '#0f172a' }} className="text-4xl font-black tracking-tighter italic uppercase leading-none mb-2">Attendance Report</h2>
                        <div className="flex items-center gap-2 text-[#64748b] font-bold uppercase tracking-widest text-[10px]">
                            <span>BillMensor Digital Log</span>
                            <span style={{ backgroundColor: '#cbd5e1' }} className="w-1 h-1 rounded-full"></span>
                            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <p style={{ color: '#7c3aed' }} className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Employee Profile</p>
                        <h3 style={{ color: '#0f172a' }} className="text-2xl font-black uppercase leading-none">{staff?.name}</h3>
                        <p style={{ color: '#94a3b8' }} className="text-sm font-bold mt-1">{staff?.role || 'Staff Member'} • {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Present', val: stats.present, color: '#22c55e', bg: '#f0fdf4', icon: MdCheckCircle },
                        { label: 'Absent', val: stats.absent, color: '#ef4444', bg: '#fef2f2', icon: MdCancel },
                        { label: 'Half Day', val: stats.half_day, color: '#f59e0b', bg: '#fffbeb', icon: MdAccessTime },
                        { label: 'Leave', val: stats.leave, color: '#3b82f6', bg: '#eff6ff', icon: MdEventAvailable },
                    ].map((s) => (
                        <div
                            key={s.label}
                            style={{ backgroundColor: 'white', borderColor: '#e2e8f0' }}
                            className="p-6 rounded-[32px] border flex flex-col items-center text-center gap-2"
                        >
                            <div style={{ backgroundColor: s.bg, color: s.color }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
                                <s.icon size={24} />
                            </div>
                            <p style={{ color: '#0f172a' }} className="text-3xl font-black italic">{s.val}</p>
                            <p style={{ color: '#94a3b8' }} className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Calendar Detail List */}
                <div
                    style={{ backgroundColor: 'white', borderColor: '#e2e8f0' }}
                    className="rounded-[40px] border overflow-hidden shadow-2xl shadow-slate-200/20"
                >
                    <div style={{ borderColor: '#f1f5f9' }} className="px-10 py-8 border-b flex items-center justify-between">
                        <h3 style={{ color: '#0f172a' }} className="text-xl font-black italic uppercase tracking-tight">Daily Breakdown</h3>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#94a3b8]">
                                <span style={{ backgroundColor: '#22c55e' }} className="w-2 h-2 rounded-full"></span> Present
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#94a3b8]">
                                <span style={{ backgroundColor: '#ef4444' }} className="w-2 h-2 rounded-full"></span> Absent
                            </span>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: getDaysInMonth() }).map((_, i) => {
                            const day = i + 1
                            const [year, month] = selectedMonth.split('-')
                            const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`
                            const record = records.find(r => r.date === dateStr)

                            const dateObj = new Date(Number(year), Number(month) - 1, day)
                            const isWeekend = dateObj.getDay() === 0 // Sunday

                            return (
                                <div
                                    key={day}
                                    style={{
                                        backgroundColor: record?.status === 'present' ? '#f0fdf4' :
                                            record?.status === 'absent' ? '#fef2f2' :
                                                record?.status === 'half_day' ? '#fffbeb' :
                                                    record?.status === 'leave' ? '#eff6ff' : '#f8fafc',
                                        borderColor: record?.status === 'present' ? '#dcfce7' :
                                            record?.status === 'absent' ? '#fee2e2' :
                                                record?.status === 'half_day' ? '#fef3c7' :
                                                    record?.status === 'leave' ? '#dbeafe' : '#f1f5f9'
                                    }}
                                    className="flex items-center justify-between p-5 rounded-3xl border transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            style={{ backgroundColor: isWeekend ? '#f97316' : 'white', color: isWeekend ? 'white' : '#0f172a' }}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic shadow-sm`}>
                                            {day}
                                        </div>
                                        <div>
                                            <p style={{ color: '#94a3b8' }} className="text-[10px] font-black uppercase tracking-widest leading-tight">
                                                {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                                            </p>
                                            <p style={{ color: '#475569' }} className="text-xs font-bold">
                                                {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {record ? (
                                            <div
                                                style={{
                                                    backgroundColor: record.status === 'present' ? '#22c55e' :
                                                        record.status === 'absent' ? '#ef4444' :
                                                            record.status === 'half_day' ? '#f59e0b' : '#3b82f6'
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white`}>
                                                {record.status.replace('_', ' ')}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#cbd5e1' }} className="text-[9px] font-black uppercase tracking-widest italic">— No Record —</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    body { background: white !important; }
                    .no-print, nav, aside, button, header, .sticky { display: none !important; }
                    #attendance-report { 
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}} />
        </div>
    )
}
