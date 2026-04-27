// components/email/EmailComposer.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Send,
  Paperclip,
  X,
  Users as UsersIcon,
  User as UserIcon,
  Sparkles,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import type { EmailTemplate, EmailRecipient } from "@/types/types";
import { RecipientSelector } from "./RecipientSelector";
import apiClient from "@/api/client";
import { toast } from "sonner";

interface EmailComposerProps {
  initialTemplate?: EmailTemplate | null;
  onClearTemplate: () => void;
  onModeChange?: (isBulk: boolean) => void;
  initialRecipient?: EmailRecipient | null;
  recipients?: EmailRecipient[]; // ✅ API data
  onClearRecipient?: () => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  initialTemplate,
  onClearTemplate,
  onModeChange,
  initialRecipient,
  recipients = [],
  onClearRecipient,
}) => {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<
    EmailRecipient[]
  >([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent of mode changes
  useEffect(() => {
    onModeChange?.(isBulkMode);
  }, [isBulkMode, onModeChange]);

  // Handle initial recipient from individual selector
  useEffect(() => {
    if (initialRecipient && !isBulkMode) {
      setSelectedRecipients([initialRecipient]);
    }
  }, [initialRecipient, isBulkMode]);

  // Clear recipients when switching modes
  useEffect(() => {
    if (isBulkMode) {
      setSelectedRecipients([]);
    } else if (initialRecipient) {
      setSelectedRecipients([initialRecipient]);
    } else {
      setSelectedRecipients([]);
    }
  }, [isBulkMode, initialRecipient]);

  useEffect(() => {
    if (initialTemplate) {
      setActiveTemplate(initialTemplate);
      setSubject(initialTemplate.subject);
      setBody(initialTemplate.body);
    }
  }, [initialTemplate]);

  // ✅ Add this helper function at the top of the component
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file); // ✅ Use ArrayBuffer instead of DataURL
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        console.log(`📎 Converted ${file.name}: ${base64.length} chars`);
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ Send email via API
  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);
    try {
      // ✅ Convert attachments to base64
      const attachmentData = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          content: await fileToBase64(file),
        })),
      );

      const payload = {
        recipients: selectedRecipients.map((r) => r.email),
        subject: subject.trim(),
        body: body.trim(),
        isBulk: isBulkMode,
        templateId: activeTemplate?.id || null,
        attachments: attachmentData, // ✅ Send attachments
      };

      const response = await apiClient.post("/email/send", payload);
      console.log("📎 Attachments to send:", attachmentData);
      console.log("📧 Full payload:", payload);

      if (response.data.success) {
        toast.success(
          `Email sent to ${selectedRecipients.length} recipient(s)!`,
        );
        setSelectedRecipients([]);
        setSubject("");
        setBody("");
        setAttachments([]);
        setActiveTemplate(null);
        onClearTemplate();
        onClearRecipient?.();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const clearTemplate = () => {
    setActiveTemplate(null);
    setSubject("");
    setBody("");
    onClearTemplate();
  };

  const handleAttachFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith("text/") || file.name.endsWith(".pdf"))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const handleUnselectRecipient = () => {
    setSelectedRecipients([]);
    onClearRecipient?.();
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="bulk-mode"
              checked={isBulkMode}
              onCheckedChange={setIsBulkMode}
              disabled={isSending}
            />
            <Label
              htmlFor="bulk-mode"
              className="flex items-center gap-1 cursor-pointer"
            >
              {isBulkMode ? (
                <>
                  <UsersIcon className="h-4 w-4" /> Bulk Sending
                </>
              ) : (
                <>
                  <UserIcon className="h-4 w-4" /> Individual
                </>
              )}
            </Label>
          </div>

          {activeTemplate && (
            <Badge
              onClick={clearTemplate}
              variant="secondary"
              className="gap-1 px-3 py-1 cursor-pointer  hover:bg-red-200"
            >
              <Sparkles className="h-3 w-3" />
              Template: {activeTemplate.name}
              <X className="h-3 w-3 ml-2 cursor-pointer hover:text-destructive" />
            </Badge>
          )}
        </div>

        {/* Recipients */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>To:</Label>
            {selectedRecipients.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedRecipients.length} recipient
                {selectedRecipients.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {isBulkMode ? (
            <RecipientSelector
              onRecipientsChange={setSelectedRecipients}
              mode="compact"
              recipients={recipients}
              selectedRecipients={selectedRecipients}
            />
          ) : (
            <div>
              {selectedRecipients.length > 0 ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {selectedRecipients[0].name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRecipients[0].email}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="cursor-pointer"
                    variant="ghost"
                    size="icon"
                    onClick={handleUnselectRecipient}
                    disabled={isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select a recipient from the sidebar to continue
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            placeholder="Email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSending}
          />
        </div>

        {/* Message */}
        <div
          className="space-y-2"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Label>Message</Label>
          <Textarea
            ref={textareaRef}
            placeholder="Write your message here..."
            className="min-h-[200px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSending}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <Label className="text-sm font-medium">
              Attachments ({attachments.length})
            </Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-background rounded-md p-2 border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getFileIcon(file)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 cursor-pointer"
                    onClick={() => removeAttachment(index)}
                    disabled={isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept="*/*"
            />
            <Button
              className="cursor-pointer"
              variant="outline"
              size="sm"
              onClick={handleAttachFiles}
              disabled={isSending}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Attach Files
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              className="cursor-pointer"
              variant="outline"
              disabled={isSending}
            >
              Save Draft
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSend}
              disabled={selectedRecipients.length === 0 || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send{" "}
                  {selectedRecipients.length > 0 &&
                    `(${selectedRecipients.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
