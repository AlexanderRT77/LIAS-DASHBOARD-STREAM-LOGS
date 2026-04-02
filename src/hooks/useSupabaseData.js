import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Hook genérico para buscar dados do Supabase com fallback para mock data.
 * Suporta Realtime via subscription automática.
 */
export function useSupabaseData(tableName, { mockData = [], orderBy = 'created_at', ascending = false, realtime = false, limit = null } = {}) {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setData(mockData)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let query = supabase.from(tableName).select('*')
      
      if (orderBy) query = query.order(orderBy, { ascending })
      if (limit) query = query.limit(limit)

      const { data: result, error: fetchError } = await query
      if (fetchError) throw fetchError
      
      setData(result?.length ? result : mockData)
    } catch (err) {
      console.warn(`⚠️ Falha ao buscar ${tableName}:`, err.message)
      setError(err.message)
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }, [tableName, orderBy, ascending, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime subscription
  useEffect(() => {
    if (!realtime || !isSupabaseConfigured()) return

    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            setData(prev => [payload.new, ...prev])
            break
          case 'UPDATE':
            setData(prev => prev.map(item => item.id === payload.new.id ? payload.new : item))
            break
          case 'DELETE':
            setData(prev => prev.filter(item => item.id !== payload.old.id))
            break
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tableName, realtime])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Hook para inserir dados no Supabase
 */
export function useSupabaseInsert(tableName) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const insert = async (rows) => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado. Dados não foram salvos.')
      return { data: rows, error: null }
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error: insertError } = await supabase
        .from(tableName)
        .insert(rows)
        .select()
      
      if (insertError) throw insertError
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const upsert = async (rows) => {
    if (!isSupabaseConfigured()) return { data: rows, error: null }

    try {
      setLoading(true)
      setError(null)
      const { data, error: upsertError } = await supabase
        .from(tableName)
        .upsert(rows)
        .select()
      
      if (upsertError) throw upsertError
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { insert, upsert, loading, error }
}
