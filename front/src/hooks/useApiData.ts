import { useCallback, useEffect, useRef, useState } from 'react'

interface ApiData<T> {
  data: T | null
  error: unknown
  loading: boolean
  reload: () => void
}

/**
 * Charge une ressource au montage, quand `key` change, ou sur reload().
 * Une réponse arrivée après un changement de clé est ignorée.
 */
export function useApiData<T>(fetcher: () => Promise<T>, key = ''): ApiData<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  // fetcher est souvent une closure recréée à chaque rendu : on garde la
  // dernière version sans en faire un déclencheur de rechargement.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [key, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload }
}
