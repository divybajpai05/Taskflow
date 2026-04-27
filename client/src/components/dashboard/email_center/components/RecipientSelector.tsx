// components/email/RecipientSelector.tsx
import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ChevronsUpDown,
  Upload,
  X,
  Users,
  UserPlus,
  Building2,
  Mail,
  Loader2,
} from "lucide-react";
import type { EmailRecipient } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";

interface RecipientSelectorProps {
  onRecipientsChange?: (recipients: EmailRecipient[]) => void;
  mode?: "compact" | "full";
  recipients?: EmailRecipient[]; // ✅ API data
  isLoading?: boolean;
  selectedRecipients: EmailRecipient[];
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  onRecipientsChange,
  mode = "compact",
  recipients = [],
  isLoading = false,
  selectedRecipients = [],
}) => {
  // const [selectedRecipients, setSelectedRecipients] = useState<
  //   EmailRecipient[]
  // >([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "employees" | "external" | "groups"
  >("employees");
  const [selectedDept, setSelectedDept] = useState("All");
  const [externalEmails, setExternalEmails] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // ✅ Dynamic departments from API data
  const departments = useMemo(() => {
    const depts = new Set(recipients.map((r) => r.department).filter(Boolean));
    return ["All", ...Array.from(depts)] as string[];
  }, [recipients]);

  // ✅ Filter by department
  const filteredEmployees = useMemo(() => {
    if (selectedDept === "All") return recipients;
    return recipients.filter((emp) => emp.department === selectedDept);
  }, [recipients, selectedDept]);

  // ✅ Dynamic groups from departments
  const groups = useMemo(() => {
    const deptGroups = departments
      .filter((d) => d !== "All")
      .map((dept) => ({
        id: dept.toLowerCase().replace(/\s+/g, "-"),
        name: `${dept} Team`,
        count: recipients.filter((r) => r.department === dept).length,
      }));

    return [
      { id: "all-employees", name: "All Employees", count: recipients.length },
      ...deptGroups,
    ];
  }, [recipients, departments]);

   const handleSelect = (recipient: EmailRecipient) => {
     const newSelection = selectedRecipients.some((r) => r.id === recipient.id)
       ? selectedRecipients.filter((r) => r.id !== recipient.id)
       : [...selectedRecipients, recipient];

     onRecipientsChange?.(newSelection);
   };

  const handleSelectAll = () => {
    if (selectAll) {
      onRecipientsChange?.([]);
    } else {
      onRecipientsChange?.(filteredEmployees);
    }
    setSelectAll(!selectAll);
  };

  const handleAddExternalEmails = () => {
    const emails = externalEmails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    const newRecipients = emails.map((email, index) => ({
      id: `ext-${Date.now()}-${index}`,
      name: email.split("@")[0],
      email: email,
      type: "external" as const,
    }));

    const updated = [...selectedRecipients, ...newRecipients];
    onRecipientsChange?.(updated);
    setExternalEmails("");
  };

   const removeRecipient = (id: string) => {
     const updated = selectedRecipients.filter((r) => r.id !== id);
     onRecipientsChange?.(updated);
   };

  const handleGroupSelect = (group: (typeof groups)[0]) => {
    let groupRecipients: EmailRecipient[] = [];

    if (group.id === "all-employees") {
      groupRecipients = recipients;
    } else {
      const deptName = group.name.replace(" Team", "");
      groupRecipients = recipients.filter((e) => e.department === deptName);
    }

    onRecipientsChange?.(groupRecipients);
  };

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ==================== COMPACT MODE ====================
  if (mode === "compact") {
    return (
      <div className="space-y-3">
        {/* Quick Groups */}
        <div className="space-y-2">
          {groups.slice(0, 3).map((group) => (
            <Button
              key={group.id}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleGroupSelect(group)}
            >
              <Users className="mr-2 h-4 w-4" />
              {group.name}
              <Badge variant="secondary" className="ml-auto">
                {group.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or select individually
            </span>
          </div>
        </div>

        {/* Individual Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Browse Employees...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput placeholder="Search employee..." />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup heading="Employees">
                  {recipients.map((emp) => (
                    <CommandItem
                      key={emp.id}
                      value={emp.email}
                      onSelect={() => handleSelect(emp)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedRecipients.some((r) => r.id === emp.id) ? "opacity-100" : "opacity-0"}`}
                      />
                      <div className="flex flex-col">
                        <span>{emp.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {emp.email}
                          {emp.department ? ` • ${emp.department}` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Recipients */}
        {selectedRecipients.length > 0 && (
          <div className="pt-2">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Selected ({selectedRecipients.length})
            </Label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {selectedRecipients.map((r) => (
                <Badge
                  key={r.id}
                  variant="secondary"
                  className="gap-1 pl-2 text-xs cursor-pointer  hover:bg-red-200"
                  onClick={() => removeRecipient(r.id)}
                >
                  {r.name}

                  <X className="h-3 w-3 ml-1 " />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== FULL MODE ====================
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as any)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="employees">
          <Users className="mr-2 h-4 w-4" />
          Employees
        </TabsTrigger>
        <TabsTrigger value="external">
          <Mail className="mr-2 h-4 w-4" />
          External
        </TabsTrigger>
        <TabsTrigger value="groups">
          <Building2 className="mr-2 h-4 w-4" />
          Groups
        </TabsTrigger>
      </TabsList>

      {/* Employees Tab */}
      <TabsContent value="employees" className="space-y-4 mt-4">
        <div className="flex gap-2 flex-wrap">
          {departments.map((dept) => (
            <Badge
              key={dept}
              variant={selectedDept === dept ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            {selectAll ? "Deselect All" : "Select All"}
          </Button>
          <Button variant="ghost" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
        </div>

        <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer"
              onClick={() => handleSelect(emp)}
            >
              <div className="flex items-center gap-3">
                <Check
                  className={`h-4 w-4 ${selectedRecipients.some((r) => r.id === emp.id) ? "opacity-100 text-primary" : "opacity-0"}`}
                />
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-muted-foreground">{emp.email}</p>
                </div>
              </div>
              {emp.department && (
                <Badge variant="outline">{emp.department}</Badge>
              )}
            </div>
          ))}
        </div>
      </TabsContent>

      {/* External Tab */}
      <TabsContent value="external" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>External Email Addresses</Label>
          <Input
            placeholder="email1@example.com, email2@example.com"
            value={externalEmails}
            onChange={(e) => setExternalEmails(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Separate multiple emails with commas
          </p>
        </div>
        <Button onClick={handleAddExternalEmails} className="w-full">
          Add Recipients
        </Button>
      </TabsContent>

      {/* Groups Tab */}
      <TabsContent value="groups" className="space-y-4 mt-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="cursor-pointer hover:bg-accent"
            onClick={() => handleGroupSelect(group)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.count} members
                  </p>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Selected Count */}
      {selectedRecipients.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">
            {selectedRecipients.length} recipient
            {selectedRecipients.length > 1 ? "s" : ""} selected
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedRecipients.slice(0, 3).map((r) => (
              <Badge key={r.id} variant="secondary">
                {r.email}
              </Badge>
            ))}
            {selectedRecipients.length > 3 && (
              <Badge variant="secondary">
                +{selectedRecipients.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </Tabs>
  );
};

// Individual Recipient Input
export const IndividualRecipientInput: React.FC<{
  onRecipientsChange: (rec: EmailRecipient[]) => void;
  recipients?: EmailRecipient[];
}> = ({ onRecipientsChange, recipients = [] }) => {
  const [email, setEmail] = useState("");
  const [recipient, setRecipient] = useState<EmailRecipient | null>(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const employee = recipients.find((emp) => emp.email === value);

    if (employee) {
      setRecipient(employee);
      onRecipientsChange([employee]);
    } else if (value.includes("@")) {
      const externalRecipient: EmailRecipient = {
        id: `ext-${Date.now()}`,
        name: value.split("@")[0],
        email: value,
        type: "external",
      };
      setRecipient(externalRecipient);
      onRecipientsChange([externalRecipient]);
    } else {
      setRecipient(null);
      onRecipientsChange([]);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="email"
        placeholder="Enter email address..."
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
      />
      {recipient && (
        <Badge variant="secondary" className="gap-1">
          {recipient.name} ({recipient.email})
          <X
            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
            onClick={() => {
              setEmail("");
              setRecipient(null);
              onRecipientsChange([]);
            }}
          />
        </Badge>
      )}
    </div>
  );
};
