import { useState, useEffect } from 'react'

// Simple replacement for GitHub Spark's useKV hook using localStorage
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((current: T) => T)) => void] {
  // Get initial value from localStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage value for key "${key}":`, error)
    }
    return defaultValue
  })

  // Create setter that updates both state and localStorage
  const setValueAndStore = (newValue: T | ((current: T) => T)) => {
    setValue(current => {
      const valueToStore = typeof newValue === 'function' ? (newValue as (current: T) => T)(current) : newValue
      
      try {
        localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.warn(`Failed to store value in localStorage for key "${key}":`, error)
      }
      
      return valueToStore
    })
  }

  return [value, setValueAndStore]
}