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
  category: string;
}

export function NoticeTemplateGenerator({ isOpen, onClose }: NoticeTemplateGeneratorProps) {
  const [noticeData, setNoticeData] = useState<NoticeData>({
    noticeText: "",
    lawyerName: "",
    designation: "",
    address: "",
    contactNumber: "",
    category: ""
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: { imageData: string; title: string; lawyerName: string; location: string; category: string }) => {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/notices/generated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
    if (!previewImage || !noticeData.lawyerName.trim() || !noticeData.category) {
      toast({
        title: "Missing Information",
        description: "Please generate an image, provide lawyer name, and select a category.",
        variant: "destructive",
      });
      return;
    }

    const title = `जाहिर सूचना /- ${noticeData.lawyerName}`;

    saveMutation.mutate({
      imageData: previewImage,
      title,
      lawyerName: noticeData.lawyerName,
      location: noticeData.address,
      category: noticeData.category
    });
  };

  const handleClose = () => {
    setNoticeData({
      noticeText: "",
      lawyerName: "",
      designation: "",
      address: "",
      contactNumber: "",
      category: ""
    });
    setPreviewImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
            Generate Notice Template
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

       


        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
          {/* Form Section */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Notice Text (Hindi/English) *
              </label>
              <Textarea
                value={noticeData.noticeText}
                onChange={(e) => handleInputChange('noticeText', e.target.value)}
                placeholder="Enter your legal notice text here..."
                rows={6}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Lawyer's Name *
              </label>
              <Input
                value={noticeData.lawyerName}
                onChange={(e) => handleInputChange('lawyerName', e.target.value)}
                placeholder="Enter lawyer's name"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Designation
              </label>
              <Input
                value={noticeData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                placeholder="एडवोकेट / Advocate"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Office Address *
              </label>
              <Textarea
                value={noticeData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter office address"
                rows={3}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Contact Number *
              </label>
              <Input
                value={noticeData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Phone number"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Category *
              </label>
              <select
                value={noticeData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                <option value="home">Home</option>
                <option value="land">Land</option>
                <option value="namechange">Name Change</option>
                <option value="property">Property Dispute</option>
                <option value="legal">Legal</option>
                <option value="public">Public Notice</option>
                <option value="court">Court Notice</option>
                <option value="tender">Tender</option>
              </select>
            </div>

            <div className="space-y-2 sm:space-y-3 pt-2">
              <Button
                onClick={generateImage}
                disabled={isGenerating}
                className="w-full bg-navy hover:bg-navy text-white text-sm py-2"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Preview"}
              </Button>
              
              {previewImage && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    className="flex-1 text-sm py-2"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                  
                  <Button
                    onClick={saveToPlat}
                    disabled={saveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                  >
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{saveMutation.isPending ? "Saving..." : "Save to Platform"}</span>
                    <span className="sm:hidden">{saveMutation.isPending ? "Saving..." : "Save"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Template Preview Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Preview</h3>
            
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
                top: isGenerating ? '-9999px' : 'auto',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {/* Header */}
             <div className="text-center mb-6">
  <img 
    src="/tag.png" 
    alt="Notice Header" 
    className="mx-auto h-24 object-contain"
  />
</div>
              {/* Body Text */}
              <div 
                className="text-justify leading-relaxed text-lg mb-8 px-4"
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  whiteSpace: 'pre-wrap',
                  maxWidth: '100%'
                }}
              >
                {noticeData.noticeText || "Your notice text will appear here..."}
              </div>

              {/* Footer */}
              <div className="bg-black text-white p-4 text-center">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-left">
                    <div 
                      className="font-bold text-lg"
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {noticeData.lawyerName || "Lawyer Name"}
                    </div>
                    {noticeData.designation && (
                      <div className="text-sm">({noticeData.designation})</div>
                    )}
                  </div>
                  <div className="text-right sm:text-right text-sm">
                    <div 
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '250px'
                      }}
                    >
                      {noticeData.address || "Office Address"}
                    </div>
                    <div>मो. नं. {noticeData.contactNumber || "Contact Number"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visible preview */}
            {!isGenerating && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-[400px] sm:max-h-[500px] lg:max-h-[600px]">
                  <div
                    className="bg-white border-2 border-black p-2 sm:p-3 transform origin-top-left"
                    style={{ 
                      width: '800px', 
                      minHeight: '600px',
                      fontFamily: '"Noto Serif Devanagari", "Noto Sans Devanagari", serif',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      scale: window.innerWidth < 640 ? '0.35' : window.innerWidth < 1024 ? '0.5' : window.innerWidth < 1280 ? '0.65' : '0.8'
                    }}
                  >
                    {/* Header */}
                    <div className="text-center mb-6">
  <img 
    src="/tag.png" 
    alt="Notice Header" 
    className="mx-auto h-24 object-contain"
  />
</div>

                    {/* Body Text */}
                    <div 
                      className="text-justify leading-relaxed text-lg mb-8 px-4"
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        whiteSpace: 'pre-wrap',
                        maxWidth: '100%'
                      }}
                    >
                      {noticeData.noticeText || "Your notice text will appear here..."}
                    </div>

                    {/* Footer */}
                    <div className="bg-black text-white p-4 text-center">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-left">
                          <div 
                            className="font-bold text-lg"
                            style={{
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                          >
                            {noticeData.lawyerName || "Lawyer Name"}
                          </div>
                          {noticeData.designation && (
                            <div className="text-sm">({noticeData.designation})</div>
                          )}
                        </div>
                        <div className="text-right sm:text-right text-sm">
                          <div 
                            style={{
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              maxWidth: '250px'
                            }}
                          >
                            {noticeData.address || "Office Address"}
                          </div>
                          <div>मो. नं. {noticeData.contactNumber || "Contact Number"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Image Preview */}
            {previewImage && (
              <div className="mt-3 sm:mt-4">
                <h4 className="text-sm sm:text-md font-semibold mb-2">Generated Image:</h4>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img 
                    src={previewImage} 
                    alt="Generated Notice" 
                    className="w-full h-auto object-contain max-h-[300px] sm:max-h-[400px]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
