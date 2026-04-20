import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip } from "@mui/joy";

export function SiteAutocomplete({ options, value, onChange, getLabel }) {
  const [open, setOpen] = React.useState(false);

  const labelFn = getLabel || ((s) => s?.nombre || "");

  const selectedOption =
    value && options.length
      ? options.find((s) => s.id.toString() === value.toString()) || null
      : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs h-8 truncate">
          <Tooltip title={selectedOption ? labelFn(selectedOption) : ""}>
            <span className="truncate">
              {selectedOption
                ? labelFn(selectedOption)
                : "Seleccionar sitio..."}
            </span>
          </Tooltip>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Buscar sitio..." />
          <CommandEmpty>No se encontró el sitio.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {options.map((s) => {
              const label = labelFn?.(s) || "";
              return (
                <CommandItem
                  key={s.id}
                  value={label}
                  onSelect={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value?.toString() === s.id.toString()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="truncate text-xs">{label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
