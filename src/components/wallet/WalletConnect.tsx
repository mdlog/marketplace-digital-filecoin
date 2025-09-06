'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { Wallet, LogOut, User } from 'lucide-react'

export function WalletConnect() {
  const { user, connectWallet, disconnect, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    if (!walletAddress.trim()) {
      return
    }

    try {
      setIsConnecting(true)
      await connectWallet(walletAddress.trim())
      setIsOpen(false)
      setWalletAddress('')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  // Mock wallet detection - in real implementation, you'd check for MetaMask, etc.
  const detectedWallets = [
    { name: 'MetaMask', icon: '🦊' },
    { name: 'WalletConnect', icon: '🔗' },
    { name: 'Coinbase Wallet', icon: '📱' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {user ? (
          <Button variant="outline" className="flex items-center gap-2">
            <User size={16} />
            <span className="hidden sm:inline">
              {user.name || user.walletAddress?.slice(0, 6) + '...' + user.walletAddress?.slice(-4)}
            </span>
          </Button>
        ) : (
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet size={16} />
            <span>Connect Wallet</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Wallet Connected' : 'Connect Your Wallet'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Your wallet is connected to the marketplace'
              : 'Connect your wallet to start buying and selling digital assets'
            }
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Wallet Address</Label>
                <span className="text-xs text-gray-500">Connected</span>
              </div>
              <div className="font-mono text-sm bg-white p-2 rounded border">
                {user.walletAddress}
              </div>
            </div>

            {user.name && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Profile Name</Label>
                <div className="text-sm">{user.name}</div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Navigate to profile page
                  window.location.href = '/profile'
                }}
                className="flex-1"
              >
                View Profile
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Manual wallet address input */}
            <div className="space-y-2">
              <Label htmlFor="wallet-address">Or Enter Wallet Address Manually</Label>
              <Input
                id="wallet-address"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="font-mono"
              />
            </div>

            <Button 
              onClick={handleConnect}
              disabled={!walletAddress.trim() || isConnecting || isLoading}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use wallet provider
                </span>
              </div>
            </div>

            {/* Detected wallets */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Wallets</Label>
              <div className="grid grid-cols-1 gap-2">
                {detectedWallets.map((wallet) => (
                  <Button
                    key={wallet.name}
                    variant="outline"
                    className="justify-start h-auto p-3"
                    onClick={() => {
                      // Mock wallet connection - in real implementation, 
                      // you'd integrate with the actual wallet provider
                      setWalletAddress('0x' + Math.random().toString(16).substr(2, 40))
                    }}
                  >
                    <span className="text-xl mr-3">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-xs text-gray-500">Click to generate mock address</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}