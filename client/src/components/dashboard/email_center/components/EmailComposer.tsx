// components/email/EmailComposer.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Paperclip,
  X,
  ChevronDown,
  Users as UsersIcon,
  User as UserIcon,
  Sparkles,
  File,
  FileText,
  Image as ImageIcon,
  Variable,
  Info,
} from "lucide-react";
import type { EmailTemplate, EmailRecipient } from "@/types/types";
import { RecipientSelector } from "./RecipientSelector";

interface EmailComposerProps {
  initialTemplate?: EmailTemplate | null;
  onClearTemplate: () => void;
  onModeChange?: (isBulk: boolean) => void;
  initialRecipient?: EmailRecipient | null;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  initialTemplate,
  onClearTemplate,
  onModeChange,
  initialRecipient,
}) => {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent of mode changes
  useEffect(() => {
    onModeChange?.(isBulkMode);
  }, [isBulkMode, onModeChange]);

  // Handle initial recipient from individual selector
  useEffect(() => {
    if (initialRecipient && !isBulkMode) {
      setRecipients([initialRecipient]);
    }
  }, [initialRecipient, isBulkMode]);

  // Clear recipients when switching modes
  useEffect(() => {
    if (isBulkMode) {
      setRecipients([]);
    } else if (initialRecipient) {
      setRecipients([initialRecipient]);
    } else {
      setRecipients([]);
    }
  }, [isBulkMode, initialRecipient]);

  useEffect(() => {
    if (initialTemplate) {
      setActiveTemplate(initialTemplate);
      setSubject(initialTemplate.subject);
      setBody(initialTemplate.body);
    }
  }, [initialTemplate]);

  const handleSend = () => {
    console.log("Sending email:", {
      recipients,
      subject,
      body,
      attachments,
      isBulk: isBulkMode,
    });
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
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type.startsWith("text/") || file.name.endsWith(".pdf")) {
      return <FileText className="h-4 w-4" />;
    }
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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="bulk-mode"
              checked={isBulkMode}
              onCheckedChange={setIsBulkMode}
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
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              Template: {activeTemplate.name}
              <X
                className="h-3 w-3 ml-2 cursor-pointer hover:text-destructive"
                onClick={clearTemplate}
              />
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>To:</Label>
            {recipients.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {recipients.length} recipient
                {recipients.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {isBulkMode ? (
            <RecipientSelector
              onRecipientsChange={setRecipients}
              mode="compact"
            />
          ) : (
            // Individual mode: Show selected recipient or placeholder
            <div>
              {recipients.length > 0 ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{recipients[0].name}</p>
                      <p className="text-sm text-muted-foreground">
                        {recipients[0].email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRecipients([])}
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

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            placeholder="Email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

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
          />
        </div>

        {/* Attachments Display */}
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
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

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

            <Button variant="outline" size="sm" onClick={handleAttachFiles}>
              <Paperclip className="mr-2 h-4 w-4" />
              Attach Files
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Save Draft</Button>
            <Button onClick={handleSend} disabled={recipients.length === 0}>
              <Send className="mr-2 h-4 w-4" />
              Send {recipients.length > 0 && `(${recipients.length})`}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
