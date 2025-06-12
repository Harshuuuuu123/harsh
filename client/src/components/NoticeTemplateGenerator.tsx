
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, X, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";

interface NoticeTemplateGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NoticeData {
  noticeText: string;
  lawyerName: string;
  designation: string;
  address: string;
  contactNumber: string;
}

export function NoticeTemplateGenerator({ isOpen, onClose }: NoticeTemplateGeneratorProps) {
  const [noticeData, setNoticeData] = useState<NoticeData>({
    noticeText: "",
    lawyerName: "",
    designation: "",
    address: "",
    contactNumber: ""
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: { imageData: string; title: string; lawyerName: string; location: string; category: string }) => {
      const response = await fetch("/api/notices/generated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Save failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Generated notice saved to platform!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notices/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof NoticeData, value: string) => {
    setNoticeData(prev => ({ ...prev, [field]: value }));
  };

  const generateImage = async () => {
    if (!noticeData.noticeText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the notice text.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const templateElement = document.getElementById('notice-template');
      if (!templateElement) return;

      const canvas = await html2canvas(templateElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: templateElement.scrollHeight,
      });

      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      setPreviewImage(imageDataUrl);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate notice image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!previewImage) return;

    const link = document.createElement('a');
    link.download = `jahir-soochna-${Date.now()}.png`;
    link.href = previewImage;
    link.click();
  };

  const saveToPlat = async () => {
    if (!previewImage || !noticeData.lawyerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please generate an image and provide lawyer name.",
        variant: "destructive",
      });
      return;
    }

    const title = `जाहिर सूचना - ${noticeData.lawyerName}`;
    
    saveMutation.mutate({
      imageData: previewImage,
      title,
      lawyerName: noticeData.lawyerName,
      location: noticeData.address,
      category: 'public'
    });
  };

  const handleClose = () => {
    setNoticeData({
      noticeText: "",
      lawyerName: "",
      designation: "",
      address: "",
      contactNumber: ""
    });
    setPreviewImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Generate Notice Template
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notice Text (Hindi/English) *
              </label>
              <Textarea
                value={noticeData.noticeText}
                onChange={(e) => handleInputChange('noticeText', e.target.value)}
                placeholder="Enter your legal notice text here..."
                rows={8}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lawyer's Name *
              </label>
              <Input
                value={noticeData.lawyerName}
                onChange={(e) => handleInputChange('lawyerName', e.target.value)}
                placeholder="Enter lawyer's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <Input
                value={noticeData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                placeholder="एडवोकेट / Advocate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office Address *
              </label>
              <Textarea
                value={noticeData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter office address"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <Input
                value={noticeData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={generateImage}
                disabled={isGenerating}
                className="w-full bg-navy hover:bg-navy text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Preview"}
              </Button>
              
              {previewImage && (
                <div className="flex gap-2">
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={saveToPlat}
                    disabled={saveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? "Saving..." : "Save to Platform"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Template Preview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            
            {/* Hidden template for image generation */}
            <div
              id="notice-template"
              className="bg-white border-4 border-black p-6"
              style={{ 
                width: '800px', 
                minHeight: '600px',
                fontFamily: '"Noto Serif Devanagari", "Noto Sans Devanagari", serif',
                position: isGenerating ? 'absolute' : 'relative',
                left: isGenerating ? '-9999px' : 'auto',
                top: isGenerating ? '-9999px' : 'auto'
              }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="bg-black text-white px-6 py-3 inline-block text-2xl font-bold">
                  जाहिर सूचना
                </div>
              </div>

              {/* Body Text */}
              <div className="text-justify leading-relaxed text-lg mb-8 px-4">
                {noticeData.noticeText || "Your notice text will appear here..."}
              </div>

              {/* Footer */}
              <div className="bg-black text-white p-4 text-center">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <div className="font-bold text-lg">
                      {noticeData.lawyerName || "Lawyer Name"}
                    </div>
                    {noticeData.designation && (
                      <div className="text-sm">({noticeData.designation})</div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div>{noticeData.address || "Office Address"}</div>
                    <div>मो. नं. {noticeData.contactNumber || "Contact Number"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visible preview */}
            {!isGenerating && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div
                  className="bg-white border-2 border-black p-3 transform scale-50 origin-top-left"
                  style={{ 
                    width: '800px', 
                    minHeight: '600px',
                    fontFamily: '"Noto Serif Devanagari", "Noto Sans Devanagari", serif'
                  }}
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="bg-black text-white px-6 py-3 inline-block text-2xl font-bold">
                      जाहिर सूचना
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="text-justify leading-relaxed text-lg mb-8 px-4">
                    {noticeData.noticeText || "Your notice text will appear here..."}
                  </div>

                  {/* Footer */}
                  <div className="bg-black text-white p-4 text-center">
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <div className="font-bold text-lg">
                          {noticeData.lawyerName || "Lawyer Name"}
                        </div>
                        {noticeData.designation && (
                          <div className="text-sm">({noticeData.designation})</div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div>{noticeData.address || "Office Address"}</div>
                        <div>मो. नं. {noticeData.contactNumber || "Contact Number"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Image Preview */}
            {previewImage && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Generated Image:</h4>
                <img 
                  src={previewImage} 
                  alt="Generated Notice" 
                  className="border border-gray-300 rounded-lg max-w-full"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
