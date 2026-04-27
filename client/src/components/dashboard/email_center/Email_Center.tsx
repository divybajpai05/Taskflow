// pages/EmailCenter.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, FileText } from "lucide-react";
import { EmailComposer } from "./components/EmailComposer";
import { TemplateLibrary } from "./components/TemplateLibrary";
import { EmailStats } from "./components/EmailStats";
import { IndividualRecipientSelector } from "./components/IndividualRecipientSelector";
import type { EmailTemplate, EmailRecipient } from "@/types/types";
import apiClient from "@/api/client";
import { toast } from "sonner";

export default function EmailCenterPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "templates">(
    "compose",
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIndividualRecipient, setSelectedIndividualRecipient] =
    useState<EmailRecipient | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

  // ✅ Fetch recipients from API
  const fetchRecipients = useCallback(async () => {
    try {
      setIsLoadingRecipients(true);
      const response = await apiClient.get("/email/recipients");
      if (response.data.success) {
        const mappedRecipients: EmailRecipient[] = response.data.data.map(
          (u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            type: "employee" as const,
            department: u.team || undefined,
          }),
        );
        setRecipients(mappedRecipients);
      }
    } catch (error) {
      console.error("Failed to fetch recipients:", error);
      toast.error("Failed to load recipients");
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setActiveTab("compose");
  };

  const handleIndividualRecipientSelect = (
    recipient: EmailRecipient | null,
  ) => {
    setSelectedIndividualRecipient(recipient);
  };

  return (
    <div className="flex h-full flex-col space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Center</h1>
          <p className="text-muted-foreground">
            Manage HR and administrative communications.
          </p>
        </div>
        <Button
          className="cursor-pointer"
          size="lg"
          onClick={() => {
            setActiveTab("compose");
            setSelectedTemplate(null);
          }}
        >
          <Mail className="mr-2 h-4 w-4" />
          Compose New Email
        </Button>
      </div>

      {/* Stats Cards */}
      <EmailStats />

      {/* Main Workspace: Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateLibrary onSelectTemplate={handleTemplateSelect} />
            </CardContent>
          </Card>

          {/* Recipient Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {isBulkMode ? "Recipient Groups" : "Select Recipient"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isBulkMode ? (
                <IndividualRecipientSelector
                  onSelect={handleIndividualRecipientSelect}
                  selectedRecipient={selectedIndividualRecipient}
                  recipients={recipients}
                  isLoading={isLoadingRecipients}
                />
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Use the recipient selector in the composer to choose groups or
                  individuals
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Composer */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="templates">Manage Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="mt-4">
              <EmailComposer
                initialTemplate={selectedTemplate}
                onClearTemplate={() => setSelectedTemplate(null)}
                onModeChange={setIsBulkMode}
                initialRecipient={selectedIndividualRecipient}
                recipients={recipients} // ✅ Pass API data
                onClearRecipient={() => setSelectedIndividualRecipient(null)}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <TemplateLibrary manageMode />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
