'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { useAuth } from '@/contexts/AuthContext'
import { pdpService } from '@/lib/pdp/pdp-service'
import { filecoinPay } from '@/lib/filecoinpay/filecoinpay-service'
import { filCDN } from '@/lib/filcdn/filcdn-service'
import { 
  Download, 
  Eye, 
  Star, 
  Heart, 
  Share2, 
  ArrowLeft, 
  User, 
  Calendar,
  Tag,
  FileText,
  ShoppingCart,
  Lock,
  Shield,
  CheckCircle,
  Clock,
  Users,
  Globe
} from 'lucide-react'

interface DigitalAsset {
  id: string
  title: string
  description?: string
  price: number
  currency: string
  tags?: string
  views: number
  downloads: number
  cid?: string
  fileSize?: number
  fileType?: string
  thumbnailCid?: string
  createdAt: string
  isPublished: boolean
  creator: {
    id: string
    name?: string
    walletAddress?: string
  }
  category?: {
    id: string
    name: string
    color?: string
  }
  reviews: Review[]
  licenses?: License[]
}

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  user: {
    id: string
    name?: string
    walletAddress?: string
  }
}

interface License {
  id: string
  type: string
  price: number
  description?: string
  duration?: number
  maxUses?: number
  permissions: string[]
  restrictions: string[]
  isTransferable: boolean
  isResellable: boolean
  priceMultiplier: number
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [asset, setAsset] = useState<DigitalAsset | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLicense, setSelectedLicense] = useState<string>('standard')
  const [licenseTemplates, setLicenseTemplates] = useState<any[]>([])
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'confirm' | 'processing' | 'completed'>('select')
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<any>(null)
  const [userLicenses, setUserLicenses] = useState<any[]>([])
  const [cdnInfo, setCdnInfo] = useState<any>(null)

  const assetId = params.id as string

  useEffect(() => {
    if (assetId) {
      fetchAsset()
      fetchLicenseTemplates()
      if (user) {
        fetchUserLicenses()
      }
    }
  }, [assetId, user])

  const fetchLicenseTemplates = async () => {
    try {
      const templates = await pdpService.getLicenseTemplates()
      setLicenseTemplates(templates)
    } catch (error) {
      console.error('Failed to fetch license templates:', error)
    }
  }

  const fetchUserLicenses = async () => {
    if (!user) return
    try {
      const licenses = await pdpService.getUserLicenses(user.id)
      setUserLicenses(licenses)
    } catch (error) {
      console.error('Failed to fetch user licenses:', error)
    }
  }

  const fetchAsset = async () => {
    try {
      // For now, we'll fetch all assets and filter by ID
      // In a real implementation, you would have a specific API endpoint
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        const foundAsset = data.assets.find((a: DigitalAsset) => a.id === assetId)
        if (foundAsset) {
          // Fetch asset licenses using PDP service
          let assetLicenses = []
          try {
            assetLicenses = await pdpService.getAssetLicenses(foundAsset.id)
          } catch (error) {
            console.error('Failed to fetch asset licenses:', error)
          }

          // Mock reviews and enhance licenses
          const assetWithDetails = {
            ...foundAsset,
            reviews: [
              {
                id: '1',
                rating: 5,
                comment: 'Excellent asset! Exactly what I needed.',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                user: {
                  id: 'user1',
                  name: 'Happy Customer',
                  walletAddress: '0x123...abc'
                }
              },
              {
                id: '2',
                rating: 4,
                comment: 'Good quality, would recommend.',
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                user: {
                  id: 'user2',
                  name: 'Satisfied Buyer',
                  walletAddress: '0x456...def'
                }
              }
            ],
            licenses: assetLicenses.length > 0 ? assetLicenses : [
              {
                id: '1',
                type: 'Standard',
                price: foundAsset.price,
                description: 'Personal use, single project',
                duration: null,
                maxUses: 1,
                permissions: ['view', 'download', 'personal-use'],
                restrictions: ['no-commercial', 'no-resale'],
                isTransferable: false,
                isResellable: false,
                priceMultiplier: 1.0
              },
              {
                id: '2',
                type: 'Extended',
                price: foundAsset.price * 2,
                description: 'Commercial use, multiple projects',
                duration: 365,
                maxUses: 5,
                permissions: ['view', 'download', 'commercial-use', 'multiple-projects'],
                restrictions: ['no-resale'],
                isTransferable: true,
                isResellable: false,
                priceMultiplier: 2.0
              },
              {
                id: '3',
                type: 'Exclusive',
                price: foundAsset.price * 5,
                description: 'Full ownership, unlimited use',
                duration: null,
                maxUses: null,
                permissions: ['view', 'download', 'commercial-use', 'unlimited-projects', 'resale', 'modification'],
                restrictions: [],
                isTransferable: true,
                isResellable: true,
                priceMultiplier: 5.0
              }
            ]
          }
          setAsset(assetWithDetails)
          
          // Generate CDN URLs using FilCDN service
          if (foundAsset.cid) {
            await generateCDNUrls(foundAsset.cid, foundAsset.fileType)
          }
          
          // Get CDN cache info
          if (foundAsset.cid) {
            await getCDNInfo(foundAsset.cid)
          }
          
          // Increment view count (in real app, this would be done server-side)
          await fetch(`/api/assets/${assetId}/view`, { method: 'POST' })
        }
      }
    } catch (error) {
      console.error('Failed to fetch asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCDNUrls = async (cid: string, fileType?: string) => {
    try {
      // Generate preview URL using FilCDN
      if (fileType?.startsWith('image/')) {
        const previewOptions = {
          cid,
          width: 800,
          height: 600,
          format: 'webp' as const,
          quality: 85,
          fit: 'cover' as const
        }
        const previewUrl = await filCDN.generatePreviewUrl(previewOptions)
        setPreviewUrl(previewUrl)
      }

      // Generate signed download URL using FilCDN
      const signedUrlOptions = {
        cid,
        expiry: 3600, // 1 hour
        allowedOperations: ['GET']
      }
      const signedUrl = await filCDN.generateSignedUrl(signedUrlOptions)
      setDownloadUrl(signedUrl)
    } catch (error) {
      console.error('Failed to generate CDN URLs:', error)
    }
  }

  const getCDNInfo = async (cid: string) => {
    try {
      const cacheInfo = await filCDN.getCacheInfo(cid)
      setCdnInfo(cacheInfo)
    } catch (error) {
      console.error('Failed to get CDN info:', error)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      setPurchaseError('Please connect your wallet to purchase')
      return
    }

    if (!asset) {
      setPurchaseError('Asset information not available')
      return
    }

    const selectedLicenseData = asset.licenses?.find(l => l.id === selectedLicense)
    if (!selectedLicenseData) {
      setPurchaseError('Please select a valid license')
      return
    }

    setPurchaseStep('confirm')
    setPurchaseError(null)
  }

  const confirmPurchase = async () => {
    if (!user || !asset) return

    const selectedLicenseData = asset.licenses?.find(l => l.id === selectedLicense)
    if (!selectedLicenseData) return

    setIsPurchasing(true)
    setPurchaseStep('processing')
    setPurchaseError(null)

    try {
      // Get gas cost estimate using FilecoinPay
      const gasEstimate = await filecoinPay.estimateGasCost(selectedLicenseData.price, asset.currency)
      
      // Create escrow using FilecoinPay
      const escrowData = {
        amount: selectedLicenseData.price,
        currency: asset.currency,
        buyer: user.walletAddress || '',
        seller: asset.creator.walletAddress || '',
        assetId: asset.id,
        releaseConditions: {
          minRating: 3,
          timeLock: 86400000, // 24 hours
          verificationRequired: false
        }
      }

      const escrowInfo = await filecoinPay.createEscrow(escrowData)

      // Fund escrow
      await filecoinPay.fundEscrow(escrowInfo.id, selectedLicenseData.price)

      // Process payment through FilecoinPay
      const paymentRequest = {
        amount: selectedLicenseData.price,
        currency: asset.currency,
        recipient: asset.creator.walletAddress || '',
        assetId: asset.id,
        buyerId: user.id,
        metadata: {
          licenseType: selectedLicenseData.type,
          escrowId: escrowInfo.id
        }
      }

      const paymentResult = await filecoinPay.createPayment(paymentRequest)

      // Mint license NFT using PDP service
      const mintRequest = {
        assetId: asset.id,
        licenseTemplateId: selectedLicenseData.type.toLowerCase(),
        purchaser: user.walletAddress || '',
        duration: selectedLicenseData.duration,
        maxUses: selectedLicenseData.maxUses,
        metadata: {
          assetTitle: asset.title,
          purchasePrice: selectedLicenseData.price,
          transactionHash: paymentResult.transactionHash,
          escrowId: escrowInfo.id,
          permissions: selectedLicenseData.permissions,
          restrictions: selectedLicenseData.restrictions
        }
      }

      const licenseNFT = await pdpService.mintLicense(mintRequest)

      // Release escrow
      await filecoinPay.releaseEscrow(escrowInfo.id, 'License minted successfully')

      setPurchaseResult({
        success: true,
        licenseNFT,
        paymentResult,
        escrowInfo
      })

      setPurchaseStep('completed')
      
      // Refresh user licenses
      await fetchUserLicenses()
      
    } catch (error) {
      console.error('Purchase error:', error)
      setPurchaseError(error instanceof Error ? error.message : 'Purchase failed')
      setPurchaseStep('select')
    } finally {
      setIsPurchasing(false)
    }
  }

  const resetPurchase = () => {
    setPurchaseStep('select')
    setPurchaseError(null)
    setPurchaseResult(null)
  }

  const checkUserLicense = () => {
    if (!user || !asset) return false
    return userLicenses.some(license => license.assetId === asset.id)
  }

  const getUserLicenseForAsset = () => {
    if (!user || !asset) return null
    return userLicenses.find(license => license.assetId === asset.id)
  }

  const parseTags = (tagsString?: string): string[] => {
    if (!tagsString) return []
    try {
      return JSON.parse(tagsString)
    } catch {
      return tagsString.split(',').map(tag => tag.trim())
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return '📄'
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('zip')) return '📦'
    return '📄'
  }

  const averageRating = asset?.reviews.length 
    ? asset.reviews.reduce((sum, review) => sum + review.rating, 0) / asset.reviews.length 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Asset Not Found</CardTitle>
            <CardDescription>The requested asset could not be found.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/')}>Back to Marketplace</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedLicenseData = licenseTemplates.find(t => t.id === selectedLicense)
  const finalPrice = selectedLicenseData ? asset.price * selectedLicenseData.priceMultiplier : asset.price

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()} className="p-2">
                <ArrowLeft size={20} />
              </Button>
              <div className="relative w-10 h-10">
                <img
                  src="/logo.svg"
                  alt="Filecoin Marketplace"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold">Asset Details</h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Asset Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt={asset.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : asset.thumbnailCid ? (
                    <img 
                      src={`https://ipfs.io/ipfs/${asset.thumbnailCid}`} 
                      alt={asset.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-8xl mb-4">{getFileTypeIcon(asset.fileType)}</div>
                      <p className="text-gray-600">Preview not available</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsLiked(!isLiked)}>
                      <Heart size={16} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Share2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset Information */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{asset.title}</CardTitle>
                    <CardDescription className="text-base">
                      {asset.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    ${finalPrice.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                {asset.tags && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={16} />
                      <span className="font-medium">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parseTags(asset.tags).map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Asset Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Views</p>
                      <p className="font-medium">{asset.views}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Downloads</p>
                      <p className="font-medium">{asset.downloads}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">File Size</p>
                      <p className="font-medium">{formatFileSize(asset.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Creator Information */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-medium">Creator</p>
                        <p className="text-sm text-gray-600">
                          {asset.creator.name || asset.creator.walletAddress?.slice(0, 6) + '...' + asset.creator.walletAddress?.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Reviews and Details */}
            <Card className="mt-6">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({asset.reviews.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <h4 className="text-lg font-semibold mb-3">About this asset</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {asset.description || 
                      'This is a high-quality digital asset available on the Filecoin marketplace. ' +
                      'The asset is stored securely on the decentralized Filecoin network, ensuring ' +
                      'permanent availability and censorship resistance.'}
                    </p>
                    
                    <h4 className="text-lg font-semibold mt-6 mb-3">Technical Details</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li><strong>File Type:</strong> {asset.fileType || 'Unknown'}</li>
                      <li><strong>File Size:</strong> {formatFileSize(asset.fileSize)}</li>
                      <li><strong>Content ID (CID):</strong> <code className="text-xs bg-gray-100 px-2 py-1 rounded">{asset.cid || 'Generating...'}</code></li>
                      <li><strong>Storage:</strong> Filecoin network with IPFS integration</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">Customer Reviews</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {averageRating.toFixed(1)} out of 5 ({asset.reviews.length} reviews)
                          </span>
                        </div>
                      </div>
                      {user && (
                        <Button variant="outline" size="sm">
                          Write Review
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {asset.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={16} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {review.user.name || review.user.walletAddress?.slice(0, 6) + '...'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Purchase Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Purchase Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* License Ownership Check */}
                {user && checkUserLicense() && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>You already own a license for this asset!</strong>
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadUrl && window.open(downloadUrl, '_blank')}
                          className="w-full"
                        >
                          <Download size={16} className="mr-2" />
                          Download Now
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Display */}
                {purchaseError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {purchaseError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Purchase Steps */}
                {purchaseStep === 'select' && (
                  <>
                    {/* License Selection */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Select License</Label>
                      <div className="space-y-3">
                        {asset.licenses?.map((license) => {
                          const userLicense = getUserLicenseForAsset()
                          const isOwned = userLicense && userLicense.metadata?.templateName === license.name
                          
                          return (
                            <div
                              key={license.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                selectedLicense === license.id 
                                  ? 'border-primary bg-primary/5' 
                                  : isOwned
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              } ${isOwned ? 'opacity-75' : ''}`}
                              onClick={() => !isOwned && setSelectedLicense(license.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{license.type}</span>
                                  {isOwned && <Badge className="bg-green-500 text-white text-xs">Owned</Badge>}
                                </div>
                                <span className="font-bold">${license.price.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-gray-600">{license.description}</p>
                              
                              <div className="mt-2 space-y-1">
                                {license.duration && (
                                  <p className="text-xs text-gray-500">
                                    <Clock size={12} className="inline mr-1" />
                                    Duration: {license.duration} days
                                  </p>
                                )}
                                {license.maxUses && (
                                  <p className="text-xs text-gray-500">
                                    <Users size={12} className="inline mr-1" />
                                    Max uses: {license.maxUses}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {license.permissions.slice(0, 3).map((permission, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                                {license.permissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{license.permissions.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">Total Price</span>
                        <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
                      </div>
                      
                      <Button 
                        onClick={handlePurchase}
                        disabled={isPurchasing || !user || checkUserLicense()}
                        className="w-full"
                        size="lg"
                      >
                        {isPurchasing ? (
                          'Processing...'
                        ) : !user ? (
                          <>
                            <Lock size={16} className="mr-2" />
                            Connect Wallet to Purchase
                          </>
                        ) : checkUserLicense() ? (
                          <>
                            <CheckCircle size={16} className="mr-2" />
                            Already Owned
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} className="mr-2" />
                            Purchase Now
                          </>
                        )}
                      </Button>
                      
                      {!user && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Connect your wallet to purchase this asset
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Confirmation Step */}
                {purchaseStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold mb-2">Confirm Purchase</h4>
                      <p className="text-sm text-gray-600">
                        Review your purchase details before proceeding
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Asset:</span>
                        <span className="font-medium">{asset?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">License:</span>
                        <span className="font-medium">
                          {asset.licenses?.find(l => l.id === selectedLicense)?.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Price:</span>
                        <span className="font-medium">${finalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={resetPurchase}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={confirmPurchase}
                        disabled={isPurchasing}
                        className="flex-1"
                      >
                        {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Processing Step */}
                {purchaseStep === 'processing' && (
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <div>
                      <h4 className="font-semibold mb-2">Processing Purchase</h4>
                      <p className="text-sm text-gray-600">
                        Please wait while we process your payment and mint your license NFT...
                      </p>
                    </div>
                    <div className="space-y-2 text-left text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Creating escrow for payment protection
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Processing payment via FilecoinPay
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Minting license NFT on blockchain
                      </div>
                    </div>
                  </div>
                )}

                {/* Completion Step */}
                {purchaseStep === 'completed' && purchaseResult && (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Purchase Successful!</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Your license NFT has been minted and added to your wallet
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-left space-y-2">
                      <div className="text-sm">
                        <strong>License NFT:</strong> {purchaseResult.licenseNFT.tokenId}
                      </div>
                      <div className="text-sm">
                        <strong>Transaction:</strong> {purchaseResult.paymentResult.transactionHash.slice(0, 10)}...
                      </div>
                      <div className="text-sm">
                        <strong>Escrow:</strong> Released to creator
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={resetPurchase}
                        className="flex-1"
                      >
                        Buy Another License
                      </Button>
                      <Button 
                        onClick={() => downloadUrl && window.open(downloadUrl, '_blank')}
                        className="flex-1"
                      >
                        <Download size={16} className="mr-2" />
                        Download Now
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">File Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span>{asset.fileType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span>{formatFileSize(asset.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600">Filecoin Network</span>
                        {cdnInfo && cdnInfo.isCached && (
                          <Badge variant="outline" className="text-xs">
                            CDN Cached
                          </Badge>
                        )}
                      </div>
                    </div>
                    {asset.cid && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">CID:</span>
                        <span className="text-xs font-mono">{asset.cid.slice(0, 16)}...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Security & Guarantees</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Secure Filecoin storage with redundancy
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Escrow payment protection
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      NFT-based digital license verification
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      Global CDN for fast access
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}