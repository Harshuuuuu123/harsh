"use client"

import type React from "react"
import { useState, memo } from "react"
import type { Notice } from "@shared/db/schema"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/queryClient"
import {
  AlertTriangle,
  User,
  Calendar,
  FileText,
  MapPin,
  Download,
  ExternalLink,
  FileImage,
  File,
  Users,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface NoticeCardProps {
  notice: Notice & { objectionCount: number }
  showFullDetails?: boolean // New prop to control detail visibility
}

function NoticeCardComponent({ notice, showFullDetails = true }: NoticeCardProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [objectionForm, setObjectionForm] = useState({
    objectorName: "",
    objectorEmail: "",
    objectorPhone: "",
    reason: "",
  })

  const [editForm, setEditForm] = useState({
    title: notice.title,
    lawyerName: notice.lawyerName,
    location: notice.location || "",
    content: notice.content || "",
    category: notice.category || "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const objectionMutation = useMutation({
    mutationFn: () => {
      const payload = {
        objectorName: objectionForm.objectorName,
        reason: objectionForm.reason,
        ...(objectionForm.objectorEmail && {
          objectorEmail: objectionForm.objectorEmail,
        }),
        ...(objectionForm.objectorPhone && {
          objectorPhone: objectionForm.objectorPhone,
        }),
      }
      return apiRequest("POST", `/api/notices/${notice.id}/objections`, payload)
    },
    onSuccess: async () => {
      toast({
        title: "Objection Filed",
        description: "Your objection has been submitted. The lawyer will be notified.",
      })
      setIsObjectionModalOpen(false)
      setObjectionForm({
        objectorName: "",
        objectorEmail: "",
        objectorPhone: "",
        reason: "",
      })
      await queryClient.invalidateQueries({ queryKey: ["/api/notices"] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to file objection. Please try again.",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append("title", editForm.title)
      formData.append("lawyerName", editForm.lawyerName)
      formData.append("location", editForm.location)
      formData.append("content", editForm.content)
      formData.append("category", editForm.category)

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      return fetch(`/api/notices/${notice.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Adjust based on your auth implementation
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Update failed")
        return res.json()
      })
    },
    onSuccess: async () => {
      toast({
        title: "Notice Updated",
        description: "Notice has been updated successfully.",
      })
      setIsEditModalOpen(false)
      setSelectedFile(null)
      await queryClient.invalidateQueries({ queryKey: ["/api/notices"] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notice. Please try again.",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/notices/${notice.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Adjust based on your auth implementation
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Delete failed")
        return res.json()
      })
    },
    onSuccess: async () => {
      toast({
        title: "Notice Deleted",
        description: "Notice has been deleted successfully.",
      })
      await queryClient.invalidateQueries({ queryKey: ["/api/notices"] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notice. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleFileObjection = () => {
    if (!objectionForm.objectorName || !objectionForm.reason) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and reason for objection.",
        variant: "destructive",
      })
      return
    }
    objectionMutation.mutate()
  }

  const handleUpdateNotice = () => {
    if (!editForm.title || !editForm.lawyerName) {
      toast({
        title: "Missing Information",
        description: "Please provide title and lawyer name.",
        variant: "destructive",
      })
      return
    }
    updateMutation.mutate()
  }

  const handleDeleteNotice = () => {
    if (window.confirm("Are you sure you want to delete this notice? This action cannot be undone.")) {
      deleteMutation.mutate()
    }
  }

  const getFileIcon = () => {
    if (notice.fileType?.includes("pdf")) return <FileText className="h-16 w-16 text-red-500" />
    if (notice.fileType?.includes("image")) return <FileImage className="h-16 w-16 text-blue-500" />
    if (notice.fileType?.includes("word") || notice.fileType?.includes("document"))
      return <FileText className="h-16 w-16 text-blue-600" />
    return <File className="h-16 w-16 text-gray-500" />
  }

  const formatDateTime = (dateInput: string | Date) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/notices/${notice.id}/download`)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = notice.fileName || `notice-${notice.id}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: "File download has begun.",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file.",
        variant: "destructive",
      })
    }
  }

  const openInNewTab = () => {
    window.open(`/${notice.filePath}`, "_blank")
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening modal when clicking on dropdown
    if ((e.target as HTMLElement).closest("[data-dropdown-trigger]")) {
      return
    }
    setIsViewModalOpen(true)
  }

  return (
    <>
      <Card
        className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative ${
          showFullDetails && notice.objectionCount > 0 ? "border-2 border-red-500" : "border border-gray-200"
        }`}
        onClick={handleCardClick}
      >
        {/* Three dots menu - only show when showFullDetails is true (for lawyers) */}
        {showFullDetails && (
          <div className="absolute top-2 right-2 z-10" data-dropdown-trigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditForm({
                      title: notice.title,
                      lawyerName: notice.lawyerName,
                      location: notice.location || "",
                      content: notice.content || "",
                      category: notice.category || "",
                    })
                    setSelectedFile(null)
                    setIsEditModalOpen(true)
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotice()
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex flex-col">
          <div className="w-full h-48 sm:h-64 bg-gray-50 flex items-center justify-center">
            {notice.fileType?.includes("image") ? (
              <img src={`/${notice.filePath}`} alt="Notice preview" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                {getFileIcon()}
                <p className="text-sm mt-2 font-medium">
                  {notice.fileType?.includes("pdf") ? "PDF Document" : "Document"}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
            {/* Only show details on home page, completely hidden on landing page */}
            {showFullDetails && (
              <>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  {notice.lawyerName}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {formatDateTime(notice.uploadDate)}
                </p>
                {notice.location && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {notice.location}
                  </p>
                )}
                <p
                  className={`text-sm flex items-center gap-2 mt-1 font-medium ${
                    notice.objectionCount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  <Users className={`w-4 h-4 ${notice.objectionCount > 0 ? "text-red-500" : "text-green-500"}`} />
                  {notice.objectionCount > 0
                    ? `${notice.objectionCount} objection${notice.objectionCount > 1 ? "s" : ""}`
                    : "No objections"}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Notice Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {notice.fileType?.includes("pdf") ? (
              <iframe src={`/${notice.filePath}`} className="w-full h-[500px] border" title="PDF Preview" />
            ) : notice.fileType?.includes("image") ? (
              <img src={`/${notice.filePath}`} alt="Notice" className="w-full max-h-[500px] object-contain" />
            ) : (
              <p className="text-center text-gray-500">Document preview not available.</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={openInNewTab} className="w-full bg-white border border-gray-300 text-gray-800">
              <ExternalLink className="h-4 w-4 mr-2" /> Preview
            </Button>
            <Button onClick={handleDownload} className="w-full bg-white border border-gray-300 text-gray-800">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button
              onClick={() => {
                setIsObjectionModalOpen(true)
                setIsViewModalOpen(false)
              }}
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Against
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-full px-4 py-5 sm:px-6 sm:py-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </Label>
              <Input
                id="title"
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter notice title"
                required
              />
            </div>
            <div>
              <Label htmlFor="lawyerName" className="block text-sm font-medium text-gray-700 mb-2">
                Lawyer Name *
              </Label>
              <Input
                id="lawyerName"
                type="text"
                value={editForm.lawyerName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    lawyerName: e.target.value,
                  }))
                }
                placeholder="Enter lawyer name"
                required
              />
            </div>
            <div>
              <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </Label>
              <Input
                id="location"
                type="text"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="Enter location"
              />
            </div>
            <div>
              <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </Label>
              <Input
                id="category"
                type="text"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="Enter category"
              />
            </div>
            <div>
              <Label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </Label>
              <Textarea
                id="content"
                value={editForm.content}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Enter content..."
              />
            </div>
            <div>
              <Label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Replace File (Optional)
              </Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFile(file || null)
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="cursor-pointer"
              />
              {selectedFile && <p className="text-sm text-gray-600 mt-1">Selected: {selectedFile.name}</p>}
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedFile(null)
                }}
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateNotice}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Notice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Objection Modal */}
      <Dialog open={isObjectionModalOpen} onOpenChange={setIsObjectionModalOpen}>
        <DialogContent className="max-w-md w-full px-4 py-5 sm:px-6 sm:py-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">File Objection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="objectorName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </Label>
              <Input
                id="objectorName"
                type="text"
                value={objectionForm.objectorName}
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    objectorName: e.target.value,
                  }))
                }
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="objectorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <Input
                id="objectorEmail"
                type="email"
                value={objectionForm.objectorEmail}
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    objectorEmail: e.target.value,
                  }))
                }
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="objectorPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </Label>
              <Input
                id="objectorPhone"
                type="tel"
                value={objectionForm.objectorPhone}
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    objectorPhone: e.target.value,
                  }))
                }
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Objection *
              </Label>
              <Textarea
                id="reason"
                value={objectionForm.reason}
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Explain your objection..."
                required
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsObjectionModalOpen(false)}
                className="flex-1"
                disabled={objectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileObjection}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={objectionMutation.isPending}
              >
                {objectionMutation.isPending ? "Filing..." : "File Objection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const NoticeCard = memo(NoticeCardComponent)
