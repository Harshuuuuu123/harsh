import { useState } from "react";
import { Notice } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, AlertTriangle, User, Calendar, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NoticeCardProps {
  notice: Notice;
}

export function NoticeCard({ notice }: NoticeCardProps) {
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
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (notice.fileType.includes('doc')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                className="w-full h-full object-cover"
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
                {formatDate(notice.uploadDate)}
              </p>
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
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Notice Document</DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4">
            {notice.fileType.includes('pdf') ? (
              <iframe 
                src={`/${notice.filePath}`}
                className="w-full h-full border-0 rounded"
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
                <p className="text-slate">Document preview not available. Click to download.</p>
              </div>
            )}
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
