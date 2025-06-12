import { useState, memo } from "react";
import { Notice } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, AlertTriangle, User, Calendar, FileText, MapPin, Download, ExternalLink, FileImage, File } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NoticeCardProps {
  notice: Notice;
}

function NoticeCardComponent({ notice }: NoticeCardProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false);
  const [objectionForm, setObjectionForm] = useState({
    objectorName: "",
    objectorEmail: "",
    objectorPhone: "",
    reason: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();



  const objectionMutation = useMutation({
    mutationFn: (data: typeof objectionForm) =>
      apiRequest("POST", `/api/notices/${notice.id}/objections`, data),
    onSuccess: () => {
      toast({
        title: "Objection Filed",
        description: "Your objection has been submitted. The lawyer will be notified.",
      });
      setIsObjectionModalOpen(false);
      setObjectionForm({
        objectorName: "",
        objectorEmail: "",
        objectorPhone: "",
        reason: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to file objection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileObjection = () => {
    if (!objectionForm.objectorName || !objectionForm.reason) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and reason for objection.",
        variant: "destructive",
      });
      return;
    }
    objectionMutation.mutate(objectionForm);
  };

  const getFileIcon = () => {
    if (notice.fileType.includes('pdf')) {
      return <FileText className="h-16 w-16 text-red-500" />;
    } else if (notice.fileType.includes('image')) {
      return <FileImage className="h-16 w-16 text-blue-500" />;
    } else if (notice.fileType.includes('word') || notice.fileType.includes('document')) {
      return <FileText className="h-16 w-16 text-blue-600" />;
    } else {
      return <File className="h-16 w-16 text-gray-500" />;
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/notices/${notice.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = notice.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "File download has begun.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file.",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = () => {
    window.open(`/${notice.filePath}`, '_blank');
  };

  return (
    <>
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-64 h-48 sm:h-auto bg-gray-50 flex items-center justify-center">
            {notice.fileType.includes('image') ? (
              <img 
                src={`/${notice.filePath}`}
                alt="Notice preview" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500 p-4">
                {getFileIcon()}
                <p className="text-sm mt-2 font-medium">{notice.fileType.includes('pdf') ? 'PDF Document' : 'Document'}</p>
              </div>
            )}
          </div>
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
              {notice.title}
            </h3>
            <div className="text-sm text-gray-600 mb-4 space-y-2">
              <p className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                {notice.lawyerName}
              </p>
              <p className="flex items-center text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDateTime(notice.uploadDate)}
              </p>
              {notice.location && (
                <p className="flex items-center text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {notice.location}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button 
                onClick={() => setIsViewModalOpen(true)}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2.5 px-4 rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button 
                onClick={() => setIsObjectionModalOpen(true)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 py-2.5 px-4 rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Against
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] h-auto sm:h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="border-b pb-4 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Notice Details</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden">
            {/* Document Preview */}
            <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px]">
              {notice.fileType.includes('pdf') ? (
                <iframe 
                  src={`/${notice.filePath}`}
                  className="w-full h-full border-0"
                  title="Notice Document"
                />
              ) : notice.fileType.includes('image') ? (
                <img 
                  src={`/${notice.filePath}`}
                  alt="Notice Document"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    {getFileIcon()}
                    <p className="text-gray-500 mt-4">Document preview not available</p>
                    <Button 
                      onClick={handleDownload}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Notice Information */}
            <div className="w-full lg:w-80 bg-white rounded-lg border p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[400px] lg:max-h-none">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-3">{notice.title}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Advocate</p>
                    <p className="font-medium text-gray-900">{notice.lawyerName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Upload Date & Time</p>
                    <p className="font-medium text-gray-900">{formatDateTime(notice.uploadDate)}</p>
                  </div>
                </div>

                {notice.location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{notice.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Document</p>
                    <p className="font-medium text-gray-900 text-sm break-words">{notice.fileName}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Button 
                  onClick={openInNewTab}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span className="text-sm">View Full Document</span>
                </Button>
                
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full py-2.5"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-sm">Download</span>
                </Button>

                <Button 
                  onClick={() => setIsObjectionModalOpen(true)}
                  variant="outline"
                  className="w-full py-2.5 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm">File Objection</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Objection Modal */}
      <Dialog open={isObjectionModalOpen} onOpenChange={setIsObjectionModalOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>File Objection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-grey mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={objectionForm.objectorName}
                onChange={(e) => setObjectionForm(prev => ({ ...prev, objectorName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-navy focus:border-navy"
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-grey mb-2">
                Email
              </label>
              <input
                type="email"
                value={objectionForm.objectorEmail}
                onChange={(e) => setObjectionForm(prev => ({ ...prev, objectorEmail: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-navy focus:border-navy"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-grey mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={objectionForm.objectorPhone}
                onChange={(e) => setObjectionForm(prev => ({ ...prev, objectorPhone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-navy focus:border-navy"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-grey mb-2">
                Reason for Objection *
              </label>
              <textarea
                value={objectionForm.reason}
                onChange={(e) => setObjectionForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-navy focus:border-navy"
                placeholder="Explain your objection..."
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
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
                className="flex-1 bg-navy hover:bg-navy text-white"
                disabled={objectionMutation.isPending}
              >
                {objectionMutation.isPending ? "Filing..." : "File Objection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const NoticeCard = memo(NoticeCardComponent);
