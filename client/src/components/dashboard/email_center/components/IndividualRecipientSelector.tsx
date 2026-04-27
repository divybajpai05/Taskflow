// components/email/IndividualRecipientSelector.tsx
import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  ChevronsUpDown,
  User,
  Mail,
  Search,
  X,
  Loader2,
} from "lucide-react";
import type { EmailRecipient } from "@/types/types";

interface IndividualRecipientSelectorProps {
  onSelect: (recipient: EmailRecipient | null) => void;
  selectedRecipient: EmailRecipient | null;
  recipients: EmailRecipient[];
  isLoading?: boolean;
}

export const IndividualRecipientSelector: React.FC<
  IndividualRecipientSelectorProps
> = ({ onSelect, selectedRecipient, recipients, isLoading = false }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"internal" | "external">(
    "internal",
  );
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipients = (recipients as EmailRecipient[]).filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.department?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );
  
  const handleSelectEmployee = (employee: EmailRecipient) => {
    onSelect(employee);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAddExternal = () => {
    if (externalEmail && externalEmail.includes("@")) {
      const externalRecipient: EmailRecipient = {
        id: `ext-${Date.now()}`,
        name: externalName || externalEmail.split("@")[0],
        email: externalEmail,
        type: "external",
      };
      onSelect(externalRecipient);
      setExternalEmail("");
      setExternalName("");
      setActiveTab("internal");
    }
  };

  const handleClearSelection = () => {
    onSelect(null);
  };

  // Selected recipient view
  if (selectedRecipient) {
    return (
      <div className="space-y-3">
        <Label>Selected Recipient</Label>
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{selectedRecipient.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedRecipient.email}
              </p>
              {selectedRecipient.department && (
                <Badge variant="outline" className="mt-1">
                  {selectedRecipient.department}
                </Badge>
              )}
              {selectedRecipient.type === "external" && (
                <Badge variant="secondary" className="mt-1 ml-1">
                  External
                </Badge>
              )}
            </div>
          </div>
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="icon"
            onClick={handleClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() => {
            handleClearSelection(); // ✅ Clear current first
            setTimeout(() => setOpen(true), 100); // ✅ Then open picker
          }}
        >
          Change Recipient
        </Button>
      </div>
    );
  }

  // No recipient selected - show selector
  return (
    <div className="space-y-3">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "internal" | "external")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal">Internal</TabsTrigger>
          <TabsTrigger value="external">External</TabsTrigger>
        </TabsList>

        {/* Internal Tab */}
        <TabsContent value="internal" className="mt-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search employees...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search by name, email, or department..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup heading="Employees">
                        {filteredRecipients.map((emp: EmailRecipient) => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() => handleSelectEmployee(emp)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center w-full">
                              <Check
                                className={`mr-2 h-4 w-4 ${(selectedRecipient as EmailRecipient | null)?.id === emp.id ? "opacity-100" : "opacity-0"}`}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">{emp.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {emp.email}
                                  {emp.department ? ` • ${emp.department}` : ""}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Recent Contacts */}
              {recipients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Recent Contacts
                  </Label>
                  <div className="space-y-1">
                    {recipients.slice(0, 4).map((emp: EmailRecipient) => (
                      <Button
                        key={emp.id}
                        variant="ghost"
                        className="w-full justify-start py-6 cursor-pointer"
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.email}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* External Tab */}
        <TabsContent value="external" className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="external-name">Name (Optional)</Label>
            <Input
              id="external-name"
              placeholder="John Doe"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="external-email">Email Address*</Label>
            <Input
              id="external-email"
              type="email"
              placeholder="john@example.com"
              value={externalEmail}
              onChange={(e) => setExternalEmail(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleAddExternal}
            disabled={!externalEmail || !externalEmail.includes("@")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Add External Recipient
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
