// components/email/BulkRecipientSelector.tsx
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
import { Check, ChevronsUpDown, Upload, X, Loader2 } from "lucide-react";
import type { EmailRecipient } from "@/types/types";

interface BulkRecipientSelectorProps {
  onRecipientsChange: (rec: EmailRecipient[]) => void;
  recipients?: EmailRecipient[]; // ✅ API data
  isLoading?: boolean;
}

export const BulkRecipientSelector: React.FC<BulkRecipientSelectorProps> = ({
  onRecipientsChange,
  recipients = [],
  isLoading = false,
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<
    EmailRecipient[]
  >([]);
  const [open, setOpen] = useState(false);

  const handleSelect = (recipient: EmailRecipient) => {
    const newSelection = selectedRecipients.some((r) => r.id === recipient.id)
      ? selectedRecipients.filter((r) => r.id !== recipient.id)
      : [...selectedRecipients, recipient];

    setSelectedRecipients(newSelection);
    onRecipientsChange(newSelection);
  };

  const removeRecipient = (id: string) => {
    const updated = selectedRecipients.filter((r) => r.id !== id);
    setSelectedRecipients(updated);
    onRecipientsChange(updated);
  };

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ==================== EMPTY STATE ====================
  if (recipients.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No employees available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedRecipients.length > 0
              ? `${selectedRecipients.length} recipient(s) selected`
              : "Select employees or upload list..."}
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
                      className={`mr-2 h-4 w-4 ${
                        selectedRecipients.some((r) => r.id === emp.id)
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
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
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload CSV List
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Chips */}
      {selectedRecipients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedRecipients.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1 pl-2">
              {r.name}
              <X
                className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                onClick={() => removeRecipient(r.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
