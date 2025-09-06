'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { useAuth } from '@/contexts/AuthContext'
import { pdpService } from '@/lib/pdp/pdp-service'
import { filCDN } from '@/lib/filcdn/filcdn-service'
import { 
  User, 
  Package, 
  Download, 
  Star, 
  Edit, 
  Save, 
  X, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Shield,
  Globe,
  BarChart3,
  Users,
  DollarSign,
  FileText,
  Eye,
  ShoppingCart,
  Nft
} from 'lucide-react'

interface UserProfile {
  user: {
    id: string
    email: string
    name?: string
    walletAddress?: string
    bio?: string
    isCreator: boolean
    avatar?: string
    createdAt: string
  }
  assets: any[]
  purchases: any[]
  reviews: any[]
  stats: {
    totalAssets: number
    totalPurchases: number
    totalReviews: number
    totalSales: number
    averageRating: number
    totalEarnings: number
    totalDownloads: number
  }
}

export default function ProfilePage() {
  const { user, sessionToken, updateProfile } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [cdnStats, setCdnStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    isCreator: false
  })

  useEffect(() => {
    if (user?.walletAddress) {
      fetchProfile()
      fetchTransactions()
      fetchLicenses()
      fetchCDNStats()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        isCreator: user.isCreator
      })
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user?walletAddress=${user?.walletAddress}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?userId=${user?.id}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }

  const fetchLicenses = async () => {
    if (!user) return
    try {
      const userLicenses = await pdpService.getUserLicenses(user.id)
      setLicenses(userLicenses)
    } catch (error) {
      console.error('Failed to fetch licenses:', error)
    }
  }

  const fetchCDNStats = async () => {
    if (!user) return
    try {
      // Mock CDN stats - in a real implementation, this would fetch actual CDN usage data
      const mockCDNStats = {
        totalBandwidth: Math.floor(Math.random() * 1000000000) + 100000000,
        totalRequests: Math.floor(Math.random() * 10000) + 1000,
        cacheHitRate: Math.random() * 0.4 + 0.6,
        averageResponseTime: Math.random() * 200 + 50,
        edgeLocations: ['nyc', 'lax', 'fra', 'sgp', 'tyo']
      }
      setCdnStats(mockCDNStats)
    } catch (error) {
      console.error('Failed to fetch CDN stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm)
      setIsEditing(false)
      // Refresh profile data
      await fetchProfile()
      await fetchTransactions()
      await fetchLicenses()
      await fetchCDNStats()
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleVerifyLicense = async (tokenId: string) => {
    try {
      const verification = await pdpService.verifyLicense(tokenId, user?.walletAddress)
      alert(`License Verification: ${verification.isValid ? 'Valid' : 'Invalid'}`)
    } catch (error) {
      console.error('License verification failed:', error)
      alert('Failed to verify license')
    }
  }

  const handleUseLicense = async (tokenId: string) => {
    try {
      const result = await pdpService.useLicense(tokenId, user?.id || '')
      if (result.success) {
        alert(`License used successfully! ${result.remainingUses !== undefined ? `Remaining uses: ${result.remainingUses}` : ''}`)
        // Refresh licenses
        await fetchLicenses()
      } else {
        alert(`Failed to use license: ${result.message}`)
      }
    } catch (error) {
      console.error('License use failed:', error)
      alert('Failed to use license')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleCancelEdit = () => {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || '',
      isCreator: user?.isCreator || false
    })
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please connect your wallet to view your profile</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10">
                <img
                  src="/logo.svg"
                  alt="Filecoin Marketplace"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold">Profile</h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    Profile Information
                  </CardTitle>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={16} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isCreator"
                        checked={editForm.isCreator}
                        onChange={(e) => setEditForm({ ...editForm, isCreator: e.target.checked })}
                      />
                      <Label htmlFor="isCreator">I am a creator</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm">
                        <Save size={16} className="mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Display Name</Label>
                      <p className="text-lg">{user.name || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Wallet Address</Label>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                        {user.walletAddress}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm">{user.email}</p>
                    </div>
                    {user.bio && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Bio</Label>
                        <p className="text-sm">{user.bio}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Account Type</Label>
                      <Badge variant={user.isCreator ? "default" : "secondary"}>
                        {user.isCreator ? "Creator" : "User"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            {profile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Assets Created</span>
                    <span className="font-medium">{profile.stats.totalAssets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Purchases Made</span>
                    <span className="font-medium">{profile.stats.totalPurchases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Reviews Given</span>
                    <span className="font-medium">{profile.stats.totalReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transactions</span>
                    <span className="font-medium">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Sales</span>
                    <span className="font-medium">{profile.stats.totalSales}</span>
                  </div>
                  {profile.stats.totalEarnings > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Earnings</span>
                      <span className="font-medium text-green-600">{formatCurrency(profile.stats.totalEarnings)}</span>
                    </div>
                  )}
                  {profile.stats.totalDownloads > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Downloads</span>
                      <span className="font-medium">{profile.stats.totalDownloads}</span>
                    </div>
                  )}
                  {profile.stats.averageRating > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {profile.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">NFT Licenses</span>
                    <span className="font-medium">{licenses.length}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CDN Stats Card */}
            {cdnStats && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe size={20} />
                    CDN Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Bandwidth</span>
                    <span className="font-medium">{formatFileSize(cdnStats.totalBandwidth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Requests</span>
                    <span className="font-medium">{cdnStats.totalRequests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Cache Hit Rate</span>
                    <span className="font-medium">{(cdnStats.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Avg Response Time</span>
                    <span className="font-medium">{cdnStats.averageResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Edge Locations</span>
                    <span className="font-medium">{cdnStats.edgeLocations.length}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="assets" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="assets" className="flex items-center gap-2">
                  <Package size={16} />
                  My Assets
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2">
                  <Download size={16} />
                  Purchases
                </TabsTrigger>
                <TabsTrigger value="licenses" className="flex items-center gap-2">
                  <Nft size={16} />
                  Licenses
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2">
                  <Star size={16} />
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assets" className="space-y-4">
                {profile?.assets && profile.assets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.assets.map((asset) => (
                      <Card key={asset.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{asset.title}</CardTitle>
                          <CardDescription>
                            {asset.category?.name} • ${asset.price}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{asset.views} views</span>
                            <span>{asset._count.purchases} sales</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Package size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No assets yet</h3>
                      <p className="text-gray-500 text-center mb-4">
                        You haven't created any digital assets yet.
                      </p>
                      <Button onClick={() => window.location.href = '/upload'}>Create Your First Asset</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="space-y-4">
                {profile?.purchases && profile.purchases.length > 0 ? (
                  <div className="space-y-4">
                    {profile.purchases.map((purchase) => (
                      <Card key={purchase.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{purchase.asset.title}</CardTitle>
                          <CardDescription>
                            Purchased on {new Date(purchase.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">${purchase.amount}</p>
                              <Badge variant={purchase.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {purchase.status}
                              </Badge>
                            </div>
                            <Button size="sm">Download</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Download size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No purchases yet</h3>
                      <p className="text-gray-500 text-center mb-4">
                        You haven't purchased any digital assets yet.
                      </p>
                      <Button onClick={() => window.location.href = '/'}>Browse Assets</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="licenses" className="space-y-4">
                {licenses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {licenses.map((license) => (
                        <Card key={license.tokenId} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Nft size={16} className="text-purple-600" />
                                License NFT
                              </CardTitle>
                              <Badge className="bg-purple-100 text-purple-800">
                                {license.metadata?.templateName || license.licenseTemplateId}
                              </Badge>
                            </div>
                            <CardDescription>
                              Token ID: {license.tokenId}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Asset ID</span>
                                <p className="font-medium">{license.assetId}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Status</span>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    license.expiresAt && license.expiresAt < Date.now() 
                                      ? 'bg-red-500' 
                                      : 'bg-green-500'
                                  }`}></div>
                                  <span className="font-medium">
                                    {license.expiresAt && license.expiresAt < Date.now() 
                                      ? 'Expired' 
                                      : 'Active'
                                    }
                                  </span>
                                </div>
                              </div>
                              {license.expiresAt && (
                                <div>
                                  <span className="text-gray-500">Expires</span>
                                  <p className="font-medium">
                                    {new Date(license.expiresAt).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              {license.maxUses !== null && (
                                <div>
                                  <span className="text-gray-500">Uses</span>
                                  <p className="font-medium">
                                    {license.usedCount}/{license.maxUses}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div>
                              <span className="text-sm text-gray-500 block mb-2">Permissions</span>
                              <div className="flex flex-wrap gap-1">
                                {license.metadata?.permissions?.slice(0, 3).map((permission: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                                {license.metadata?.permissions?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{license.metadata.permissions.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleVerifyLicense(license.tokenId)}
                                className="flex-1"
                              >
                                <Shield size={14} className="mr-1" />
                                Verify
                              </Button>
                              {license.maxUses === null || license.usedCount < license.maxUses ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleUseLicense(license.tokenId)}
                                  className="flex-1"
                                >
                                  <FileText size={14} className="mr-1" />
                                  Use License
                                </Button>
                              ) : (
                                <Button size="sm" disabled className="flex-1">
                                  Max Uses Reached
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Nft size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No NFT licenses yet</h3>
                      <p className="text-gray-500 text-center mb-4">
                        You haven't purchased any NFT licenses yet.
                      </p>
                      <Button onClick={() => window.location.href = '/'}>Browse Assets</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {transaction.type === 'PURCHASE' ? (
                                  <Download size={16} className="text-green-600" />
                                ) : transaction.type === 'REFUND' ? (
                                  <TrendingUp size={16} className="text-red-600" />
                                ) : (
                                  <Clock size={16} className="text-blue-600" />
                                )}
                                {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                              </CardTitle>
                              <CardDescription>
                                {new Date(transaction.createdAt).toLocaleDateString()} • {new Date(transaction.createdAt).toLocaleTimeString()}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                transaction.status === 'COMPLETED' ? 'default' :
                                transaction.status === 'PENDING' ? 'secondary' :
                                transaction.status === 'FAILED' ? 'destructive' : 'outline'
                              }>
                                {transaction.status}
                              </Badge>
                              {transaction.status === 'COMPLETED' && (
                                <CheckCircle size={16} className="text-green-600" />
                              )}
                              {transaction.status === 'FAILED' && (
                                <XCircle size={16} className="text-red-600" />
                              )}
                              {transaction.status === 'PENDING' && (
                                <Clock size={16} className="text-blue-600" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Amount</span>
                              <span className="font-medium">${transaction.amount} {transaction.currency}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Transaction Hash</span>
                              <span className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                                {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                              </span>
                            </div>
                            {transaction.purchase && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Asset</span>
                                <span className="font-medium">{transaction.purchase.asset.title}</span>
                              </div>
                            )}
                            {transaction.gasUsed && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Gas Used</span>
                                <span className="font-medium">{transaction.gasUsed} units</span>
                              </div>
                            )}
                            {transaction.blockNumber && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Block Number</span>
                                <span className="font-medium">#{transaction.blockNumber}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <TrendingUp size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                      <p className="text-gray-500 text-center mb-4">
                        You haven't made any transactions yet.
                      </p>
                      <Button onClick={() => window.location.href = '/'}>Browse Assets</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {profile?.reviews && profile.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {profile.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{review.asset.title}</CardTitle>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <CardDescription>
                            Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {review.comment && (
                            <p className="text-sm">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Star size={48} className="text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                      <p className="text-gray-500 text-center mb-4">
                        You haven't reviewed any purchases yet.
                      </p>
                      <Button onClick={() => window.location.href = '/profile?purchases=true'}>View Purchases</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}