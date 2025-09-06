'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name?: string
  walletAddress?: string
  bio?: string
  isCreator: boolean
  avatar?: string
}

interface AuthContextType {
  user: User | null
  sessionToken: string | null
  isLoading: boolean
  connectWallet: (walletAddress: string) => Promise<void>
  disconnect: () => void
  updateProfile: (profileData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const savedSession = localStorage.getItem('sessionToken')
    const savedUser = localStorage.getItem('user')

    if (savedSession && savedUser) {
      setSessionToken(savedSession)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const connectWallet = async (walletAddress: string) => {
    try {
      setIsLoading(true)
      
      // In a real implementation, you would get a signature from the wallet here
      // For demo purposes, we'll skip the signature verification
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          // signature: '0x...', // Add real signature in production
          message: 'Sign in to Filecoin Marketplace'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to authenticate')
      }

      const data = await response.json()
      
      setUser(data.user)
      setSessionToken(data.sessionToken)
      
      // Save to localStorage
      localStorage.setItem('sessionToken', data.sessionToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
    } catch (error) {
      console.error('Wallet connection error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setUser(null)
    setSessionToken(null)
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('user')
  }

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          userId: user.id,
          ...profileData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isLoading,
        connectWallet,
        disconnect,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}