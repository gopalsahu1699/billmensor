'use client'

import { useEffect } from 'react'

export function useUnsavedChanges(dirty: boolean, active = true) {
    useEffect(() => {
        if (!active || !dirty) return
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [dirty, active])

    return {
        confirmLeave: (): boolean => {
            if (!dirty) return true
            return window.confirm('You have unsaved changes. Are you sure you want to leave?')
        },
    }
}
