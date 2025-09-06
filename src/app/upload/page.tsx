'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { useAuth } from '@/contexts/AuthContext'
import { pdpService } from '@/lib/pdp/pdp-service'
import { Upload, X, Plus, File, Image, Video, Music, FileText, Box, HardDrive, Shield, DollarSign, Users } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
}

interface LicenseTemplate {
  id: string
  name: string
  description: string
  type: 'standard' | 'extended' | 'exclusive' | 'custom'
  permissions: string[]
  restrictions: string[]
  duration?: number
  maxUses?: number
  isTransferable: boolean
  isResellable: boolean
  priceMultiplier: number
}

interface AssetFile {
  id: string
  name: string
  size: number
  type: string
  file: File
  preview?: string
  isPrimary: boolean
}

export default function UploadPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [licenseTemplates, setLicenseTemplates] = useState<LicenseTemplate[]>([])
  const [selectedFiles, setSelectedFiles] = useState<AssetFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    categoryId: '',
    tags: '',
    isPublished: true,
    enableLicenses: false,
    selectedLicenseIds: [] as string[],
    customLicensePrice: ''
  })

  useEffect(() => {
    fetchCategories()
    fetchLicenseTemplates()
  }, [])

  const fetchLicenseTemplates = async () => {
    try {
      const templates = await pdpService.getLicenseTemplates()
      setLicenseTemplates(templates)
    } catch (error) {
      console.error('Failed to fetch license templates:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    const newFiles: AssetFile[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      isPrimary: selectedFiles.length === 0 && index === 0
    }))

    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId)
      // If we removed the primary file, make the first remaining file primary
      if (updatedFiles.length > 0 && !updatedFiles.find(f => f.isPrimary)) {
        updatedFiles[0].isPrimary = true
      }
      return updatedFiles
    })
  }

  const setPrimaryFile = (fileId: string) => {
    setSelectedFiles(prev => prev.map(f => ({
      ...f,
      isPrimary: f.id === fileId
    })))
  }

  const toggleLicenseSelection = (licenseId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLicenseIds: prev.selectedLicenseIds.includes(licenseId)
        ? prev.selectedLicenseIds.filter(id => id !== licenseId)
        : [...prev.selectedLicenseIds, licenseId]
    }))
  }

  const calculateLicensePrice = (basePrice: number, license: LicenseTemplate) => {
    return basePrice * license.priceMultiplier
  }

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-blue-100 text-blue-800'
      case 'extended': return 'bg-purple-100 text-purple-800'
      case 'exclusive': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={24} />
    if (fileType.startsWith('video/')) return <Video size={24} />
    if (fileType.startsWith('audio/')) return <Music size={24} />
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText size={24} />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Box size={24} />
    return <File size={24} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please connect your wallet first')
      return
    }

    if (selectedFiles.length === 0) {
      alert('Please select at least one file')
      return
    }

    if (!formData.title || !formData.price || !formData.categoryId) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.enableLicenses && formData.selectedLicenseIds.length === 0) {
      alert('Please select at least one license template')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload files using SynapseSDK
      const uploadFormData = new FormData()
      selectedFiles.forEach(file => {
        uploadFormData.append('files', file.file)
      })
      uploadFormData.append('generateThumbnails', 'true')
      uploadFormData.append('metadata', JSON.stringify({
        title: formData.title,
        description: formData.description,
        creator: user.walletAddress,
        category: formData.categoryId
      }))

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Failed to upload files')
      }

      const uploadResult = await uploadResponse.json()
      
      // Get the primary file result
      const primaryFile = selectedFiles.find(f => f.isPrimary)
      const primaryUploadResult = uploadResult.files.find((f: any) => f.name === primaryFile?.name) || uploadResult.files[0]

      // Create asset in database
      const assetData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        tags: formData.tags,
        categoryId: formData.categoryId,
        creatorId: user.id,
        cid: primaryUploadResult.cid,
        fileSize: selectedFiles.reduce((sum, file) => sum + file.size, 0),
        fileType: primaryFile?.type,
        thumbnailCid: primaryUploadResult.thumbnailCid,
        isPublished: formData.isPublished
      }

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      })

      if (!response.ok) {
        throw new Error('Failed to create asset')
      }

      const result = await response.json()
      
      // Create licenses if enabled
      if (formData.enableLicenses && formData.selectedLicenseIds.length > 0) {
        for (const licenseTemplateId of formData.selectedLicenseIds) {
          const template = licenseTemplates.find(t => t.id === licenseTemplateId)
          if (template) {
            try {
              const licenseData = {
                assetId: result.id,
                type: template.type,
                price: calculateLicensePrice(parseFloat(formData.price), template),
                description: template.description,
                duration: template.duration,
                maxUses: template.maxUses
              }

              const licenseResponse = await fetch('/api/licenses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(licenseData),
              })

              if (!licenseResponse.ok) {
                console.error('Failed to create license:', template.name)
              }
            } catch (error) {
              console.error('Error creating license:', error)
            }
          }
        }
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        currency: 'USD',
        categoryId: '',
        tags: '',
        isPublished: true,
        enableLicenses: false,
        selectedLicenseIds: [],
        customLicensePrice: ''
      })
      setSelectedFiles([])
      
      alert('Asset uploaded successfully to Filecoin!')
      
      // Redirect to the asset page
      window.location.href = `/asset/${result.id}`
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload asset: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please connect your wallet to upload assets</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <WalletConnect />
          </CardContent>
        </Card>
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
              <h1 className="text-2xl font-bold">Upload Asset</h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={20} />
                Upload Files
              </CardTitle>
              <CardDescription>
                Select the files you want to upload. The first file will be set as primary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                  <p className="text-sm text-gray-500">
                    Support for images, videos, audio, documents, and more
                  </p>
                  <Button type="button" className="mt-4" disabled={isUploading}>
                    Select Files
                  </Button>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Selected Files</Label>
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedFiles.length > 1 && (
                          <Button
                            type="button"
                            variant={file.isPrimary ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPrimaryFile(file.id)}
                          >
                            {file.isPrimary ? "Primary" : "Set Primary"}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={isUploading}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploading to Filecoin...</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500">
                    {uploadProgress.toFixed(0)}% complete - Storing on decentralized network
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
              <CardDescription>
                Provide details about your digital asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter asset title"
                    required
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your asset..."
                  rows={4}
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enter tags separated by commas"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: digital, art, creative, design
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>
                Configure how your asset will be displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  disabled={isUploading}
                />
                <Label htmlFor="isPublished">Publish immediately</Label>
              </div>
              <p className="text-sm text-gray-500">
                If unchecked, your asset will be saved as a draft and won't be visible in the marketplace.
              </p>
            </CardContent>
          </Card>

          {/* License Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                License Configuration
              </CardTitle>
              <CardDescription>
                Configure digital licenses for your asset using NFT-based smart contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Digital Licenses</Label>
                  <p className="text-sm text-gray-500">
                    Allow buyers to purchase NFT-based licenses with different usage rights
                  </p>
                </div>
                <Switch
                  checked={formData.enableLicenses}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableLicenses: checked })}
                  disabled={isUploading}
                />
              </div>

              {formData.enableLicenses && (
                <>
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Select License Templates</Label>
                    <p className="text-sm text-gray-500">
                      Choose which license types buyers can purchase for your asset
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {licenseTemplates.map((template) => (
                        <Card 
                          key={template.id} 
                          className={`cursor-pointer transition-all duration-200 ${
                            formData.selectedLicenseIds.includes(template.id) 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => toggleLicenseSelection(template.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedLicenseIds.includes(template.id)}
                                  onChange={() => {}}
                                  className="rounded"
                                />
                                <Badge className={getLicenseTypeColor(template.type)}>
                                  {template.type}
                                </Badge>
                              </div>
                              <DollarSign size={16} className="text-gray-400" />
                            </div>
                            
                            <h4 className="font-semibold text-sm mb-2">{template.name}</h4>
                            <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users size={14} className="text-gray-400" />
                                <span className="text-xs">
                                  {template.isTransferable ? 'Transferable' : 'Non-transferable'}
                                </span>
                              </div>
                              
                              {template.duration && (
                                <div className="text-xs text-gray-500">
                                  Duration: {template.duration} days
                                </div>
                              )}
                              
                              {template.maxUses && (
                                <div className="text-xs text-gray-500">
                                  Max uses: {template.maxUses}
                                </div>
                              )}
                              
                              <div className="text-xs font-medium text-green-600">
                                {formData.price && (
                                  <>Price: ${calculateLicensePrice(parseFloat(formData.price), template).toFixed(2)}</>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3 space-y-1">
                              <div className="text-xs font-medium text-gray-700">Permissions:</div>
                              <div className="flex flex-wrap gap-1">
                                {template.permissions.slice(0, 3).map((permission, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                                {template.permissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.permissions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {formData.selectedLicenseIds.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        Selected License Templates ({formData.selectedLicenseIds.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedLicenseIds.map(licenseId => {
                          const template = licenseTemplates.find(t => t.id === licenseId)
                          return template ? (
                            <Badge key={licenseId} className={getLicenseTypeColor(template.type)}>
                              {template.name} - ${formData.price ? calculateLicensePrice(parseFloat(formData.price), template).toFixed(2) : '0.00'}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="min-w-[120px]"
            >
              {isUploading ? 'Uploading...' : 'Upload Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}