// components/email/RecipientSelector.tsx
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
} from "lucide-react";
import type { EmailRecipient } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";

// Mock data
const EMPLOYEES: EmailRecipient[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    email: "rahul.s@company.com",
    type: "employee",
    department: "Engineering",
  },
  {
    id: "2",
    name: "Priya Patel",
    email: "priya.p@company.com",
    type: "employee",
    department: "HR",
  },
  {
    id: "3",
    name: "Alex Johnson",
    email: "alex.j@company.com",
    type: "employee",
    department: "Sales",
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah.w@company.com",
    type: "employee",
    department: "Marketing",
  },
  {
    id: "5",
    name: "Mike Chen",
    email: "mike.c@company.com",
    type: "employee",
    department: "Engineering",
  },
];

const DEPARTMENTS = ["All", "Engineering", "HR", "Sales", "Marketing"];

interface RecipientSelectorProps {
  onRecipientsChange?: (recipients: EmailRecipient[]) => void;
  mode?: "compact" | "full";
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  onRecipientsChange,
  mode = "compact",
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<
    EmailRecipient[]
  >([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "employees" | "external" | "groups"
  >("employees");
  const [selectedDept, setSelectedDept] = useState("All");
  const [externalEmails, setExternalEmails] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const filteredEmployees =
    selectedDept === "All"
      ? EMPLOYEES
      : EMPLOYEES.filter((emp) => emp.department === selectedDept);

  const handleSelect = (recipient: EmailRecipient) => {
    const newSelection = selectedRecipients.some((r) => r.id === recipient.id)
      ? selectedRecipients.filter((r) => r.id !== recipient.id)
      : [...selectedRecipients, recipient];

    setSelectedRecipients(newSelection);
    onRecipientsChange?.(newSelection);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients([]);
      onRecipientsChange?.([]);
    } else {
      setSelectedRecipients(filteredEmployees);
      onRecipientsChange?.(filteredEmployees);
    }
    setSelectAll(!selectAll);
  };

  const handleAddExternalEmails = () => {
    const emails = externalEmails.split(",").map((email) => email.trim());
    const newRecipients = emails.map((email, index) => ({
      id: `ext-${Date.now()}-${index}`,
      name: email.split("@")[0],
      email: email,
      type: "external" as const,
    }));

    const updated = [...selectedRecipients, ...newRecipients];
    setSelectedRecipients(updated);
    onRecipientsChange?.(updated);
    setExternalEmails("");
  };

  const removeRecipient = (id: string) => {
    const updated = selectedRecipients.filter((r) => r.id !== id);
    setSelectedRecipients(updated);
    onRecipientsChange?.(updated);
  };

  // Predefined groups
  const groups = [
    { id: "all-employees", name: "All Employees", count: EMPLOYEES.length },
    { id: "engineering", name: "Engineering Team", count: 2 },
    { id: "hr", name: "HR Team", count: 1 },
    { id: "management", name: "Management", count: 3 },
  ];

  const handleGroupSelect = (group: (typeof groups)[0]) => {
    let groupRecipients: EmailRecipient[] = [];

    if (group.id === "all-employees") {
      groupRecipients = EMPLOYEES;
    } else if (group.id === "engineering") {
      groupRecipients = EMPLOYEES.filter((e) => e.department === "Engineering");
    } else if (group.id === "hr") {
      groupRecipients = EMPLOYEES.filter((e) => e.department === "HR");
    }

    setSelectedRecipients(groupRecipients);
    onRecipientsChange?.(groupRecipients);
  };

  if (mode === "compact") {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {groups.map((group) => (
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
                  {EMPLOYEES.map((emp) => (
                    <CommandItem
                      key={emp.id}
                      value={emp.email}
                      onSelect={() => handleSelect(emp)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedRecipients.some((r) => r.id === emp.id)
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span>{emp.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {emp.email} • {emp.department}
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
                  className="gap-1 pl-2 text-xs"
                >
                  {r.name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => removeRecipient(r.id)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode with tabs
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

      <TabsContent value="employees" className="space-y-4 mt-4">
        {/* Department Filter */}
        <div className="flex gap-2 flex-wrap">
          {DEPARTMENTS.map((dept) => (
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

        {/* Select All */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            {selectAll ? "Deselect All" : "Select All"}
          </Button>
          <Button variant="ghost" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
        </div>

        {/* Employee List */}
        <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer"
              onClick={() => handleSelect(emp)}
            >
              <div className="flex items-center gap-3">
                <Check
                  className={`h-4 w-4 ${
                    selectedRecipients.some((r) => r.id === emp.id)
                      ? "opacity-100 text-primary"
                      : "opacity-0"
                  }`}
                />
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-muted-foreground">{emp.email}</p>
                </div>
              </div>
              <Badge variant="outline">{emp.department}</Badge>
            </div>
          ))}
        </div>
      </TabsContent>

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

      {/* Selected Count Display */}
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

// Also export the individual recipient input component
export const IndividualRecipientInput: React.FC<{
  onRecipientsChange: (rec: EmailRecipient[]) => void;
}> = ({ onRecipientsChange }) => {
  const [email, setEmail] = useState("");
  const [recipient, setRecipient] = useState<EmailRecipient | null>(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);

    // Check if it's an internal employee
    const employee = EMPLOYEES.find((emp) => emp.email === value);

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
