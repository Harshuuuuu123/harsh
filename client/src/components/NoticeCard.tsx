import { useState, memo } from "react";
import { Notice } from "@shared/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NoticeCardProps {
  notice: Notice & { objectionCount: number };
}

function NoticeCardComponent({ notice }: NoticeCardProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false);
  const [objectionForm, setObjectionForm] = useState({
    objectorName: "",
    objectorEmail: "",
    objectorPhone: "",
    reason: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      };
      return apiRequest(
        "POST",
        `/api/notices/${notice.id}/objections`,
        payload
      );
    },
    onSuccess: async () => {
      toast({
        title: "Objection Filed",
        description:
          "Your objection has been submitted. The lawyer will be notified.",
      });
      setIsObjectionModalOpen(false);
      setObjectionForm({
        objectorName: "",
        objectorEmail: "",
        objectorPhone: "",
        reason: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
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
    objectionMutation.mutate();
  };

  const getFileIcon = () => {
    if (notice.fileType.includes("pdf"))
      return <FileText className="h-16 w-16 text-red-500" />;
    if (notice.fileType.includes("image"))
      return <FileImage className="h-16 w-16 text-blue-500" />;
    if (
      notice.fileType.includes("word") ||
      notice.fileType.includes("document")
    )
      return <FileText className="h-16 w-16 text-blue-600" />;
    return <File className="h-16 w-16 text-gray-500" />;
  };

  const formatDateTime = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/notices/${notice.id}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
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
    window.open(`/${notice.filePath}`, "_blank");
  };

  return (
    <>
      <Card
        className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
          notice.objectionCount > 0
            ? "border-2 border-red-500"
            : "border border-gray-200"
        }`}
        onClick={() => setIsViewModalOpen(true)}
      >
        <div className="flex flex-col">
          <div className="w-full h-48 sm:h-64 bg-gray-50 flex items-center justify-center">
            {notice.fileType.includes("image") ? (
              <img
                src={`/${notice.filePath}`}
                alt="Notice preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500 p-4">
                {getFileIcon()}
                <p className="text-sm mt-2 font-medium">
                  {notice.fileType.includes("pdf")
                    ? "PDF Document"
                    : "Document"}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {notice.title}
            </h3>

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
              <Users
                className={`w-4 h-4 ${
                  notice.objectionCount > 0
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              />
              {notice.objectionCount > 0
                ? `${notice.objectionCount} objection${
                    notice.objectionCount > 1 ? "s" : ""
                  }`
                : "No objections"}
            </p>
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
            {notice.fileType.includes("pdf") ? (
              <iframe
                src={`/${notice.filePath}`}
                className="w-full h-[500px] border"
                title="PDF Preview"
              />
            ) : notice.fileType.includes("image") ? (
              <img
                src={`/${notice.filePath}`}
                alt="Notice"
                className="w-full max-h-[500px] object-contain"
              />
            ) : (
              <p className="text-center text-gray-500">
                Document preview not available.
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={openInNewTab}
              className="w-full bg-white border border-gray-300 text-gray-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Preview
            </Button>
            <Button
              onClick={handleDownload}
              className="w-full bg-white border border-gray-300 text-gray-800"
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button
              onClick={() => {
                setIsObjectionModalOpen(true);
                setIsViewModalOpen(false);
              }}
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Against
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Objection Modal */}
      <Dialog
        open={isObjectionModalOpen}
        onOpenChange={setIsObjectionModalOpen}
      >
        <DialogContent className="max-w-md w-full px-4 py-5 sm:px-6 sm:py-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">File Objection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-dark-grey mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={objectionForm.objectorName}
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    objectorName: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    objectorEmail: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    objectorPhone: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-grey mb-2">
                Reason for Objection *
              </label>
              <textarea
                value={objectionForm.reason}
                onChange={(e) =>
                  setObjectionForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                className="flex-1 bg-navy text-white hover:bg-navy/90"
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