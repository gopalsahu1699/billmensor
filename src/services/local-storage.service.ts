/**
 * Local Storage Service
 * Uses IndexedDB directly for client-side data persistence.
 * Used by free-tier users for local backup/restore functionality.
 */

const DB_NAME = 'billmensor_local'
const DB_VERSION = 1
const STORE_NAME = 'user_data'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('dataType', 'dataType', { unique: false })
        store.createIndex('userId_dataType', ['userId', 'dataType'], { unique: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

interface LocalDataRecord {
  id: string
  userId: string
  dataType: string
  data: unknown
  updatedAt: string
}

function makeId(userId: string, dataType: string): string {
  return `${userId}::${dataType}`
}

/**
 * Save data to IndexedDB for a specific user and data type.
 */
export async function saveLocalData(
  userId: string,
  dataType: string,
  data: unknown
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const record: LocalDataRecord = {
      id: makeId(userId, dataType),
      userId,
      dataType,
      data,
      updatedAt: new Date().toISOString(),
    }
    const req = store.put(record)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Get data from IndexedDB for a specific user and data type.
 */
export async function getLocalData(
  userId: string,
  dataType: string
): Promise<unknown | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(makeId(userId, dataType))
    req.onsuccess = () => {
      const record: LocalDataRecord | undefined = req.result
      resolve(record ? record.data : null)
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Get all data for a specific user across all data types.
 */
export async function getAllLocalData(
  userId: string
): Promise<Record<string, unknown>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('userId')
    const req = index.getAll(IDBKeyRange.only(userId))
    req.onsuccess = () => {
      const records: LocalDataRecord[] = req.result
      const result: Record<string, unknown> = {}
      for (const r of records) {
        result[r.dataType] = r.data
      }
      resolve(result)
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Clear all local data for a specific user.
 */
export async function clearLocalData(userId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('userId')
    const req = index.openCursor(IDBKeyRange.only(userId))
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Export all local data for a user as a JSON-serializable object.
 */
export async function exportLocalData(
  userId: string
): Promise<{ version: string; exported_at: string; data: Record<string, unknown> }> {
  const allData = await getAllLocalData(userId)
  return {
    version: '1.0-local',
    exported_at: new Date().toISOString(),
    data: allData,
  }
}

/**
 * Import data from a JSON object into IndexedDB for a specific user.
 * Each key in jsonData.data is treated as a data type.
 */
export async function importLocalData(
  userId: string,
  jsonData: { data: Record<string, unknown> }
): Promise<void> {
  const data = jsonData?.data
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format: expected { data: { ... } }')
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    let pending = 0
    const types = Object.keys(data)

    if (types.length === 0) {
      resolve()
      return
    }

    let hasErrored = false

    for (const dataType of types) {
      pending++
      const record: LocalDataRecord = {
        id: makeId(userId, dataType),
        userId,
        dataType,
        data: data[dataType],
        updatedAt: new Date().toISOString(),
      }
      const req = store.put(record)
      req.onsuccess = () => {
        pending--
        if (pending === 0 && !hasErrored) resolve()
      }
      req.onerror = () => {
        hasErrored = true
        reject(req.error)
      }
    }
  })
}
