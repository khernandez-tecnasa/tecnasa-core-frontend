"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* Root Command (contenedor principal) */
const Command = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

/* CommandDialog: usa tu Dialog interno y agrega Title oculto */
const CommandDialog = ({ children, ...props }) => {
  return (
    <Dialog {...props}>
      <DialogContent
        // Evita warning de descripción faltante
        aria-describedby={undefined}
        className="top-[12%] translate-y-0 w-[95vw] max-w-2xl gap-0 overflow-hidden rounded-3xl sm:rounded-3xl border border-border/60 bg-card dark:bg-slate-900 p-0 shadow-2xl dark:shadow-black/60 data-[state=open]:slide-in-from-top-4">
        {/* Header/Title ocultos para accesibilidad (Radix feliz) */}
        <DialogHeader className="sr-only">
          <DialogTitle>Buscador rápido</DialogTitle>
          <DialogDescription>
            Busca módulos y ejecuta acciones rápidas.
          </DialogDescription>
        </DialogHeader>

        {/* Barra de acento, mismo patrón que los modales del resto de la app */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30 shrink-0" />

        <Command
          className={cn(
            "bg-transparent",
            "[&_[cmdk-group-heading]]:px-3",
            "[&_[cmdk-group-heading]]:py-2",
            "[&_[cmdk-group-heading]]:text-[10px]",
            "[&_[cmdk-group-heading]]:font-black",
            "[&_[cmdk-group-heading]]:uppercase",
            "[&_[cmdk-group-heading]]:tracking-widest",
            "[&_[cmdk-group-heading]]:text-muted-foreground/60",
            "[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0",
            "[&_[cmdk-group]]:px-2",
            "[&_[cmdk-input-wrapper]_svg]:h-[18px]",
            "[&_[cmdk-input-wrapper]_svg]:w-[18px]",
            "[&_[cmdk-input]]:h-14",
            "[&_[cmdk-item]]:px-3",
            "[&_[cmdk-item]]:py-2.5",
            "[&_[cmdk-item]]:rounded-xl",
            "[&_[cmdk-item]]:my-0.5",
          )}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

/* Input dentro del command */
const CommandInput = React.forwardRef(({ className, ...props }, ref) => (
  <div
    className="flex items-center gap-2.5 border-b border-border/60 px-4"
    cmdk-input-wrapper="">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
      <Search className="h-4 w-4 text-primary" />
    </div>
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-14 w-full rounded-md bg-transparent text-[15px] font-medium outline-none",
        "placeholder:text-muted-foreground/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

/* Lista de resultados */
const CommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[60vh] sm:max-h-[420px] overflow-y-auto overflow-x-hidden p-2", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

/* Estado "vacío" */
const CommandEmpty = React.forwardRef((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="flex flex-col items-center justify-center gap-3 py-14 text-center"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/* Grupo de items */
const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground",
      "[&_[cmdk-group-heading]]:px-3",
      "[&_[cmdk-group-heading]]:py-2",
      "[&_[cmdk-group-heading]]:text-[10px]",
      "[&_[cmdk-group-heading]]:font-black",
      "[&_[cmdk-group-heading]]:uppercase",
      "[&_[cmdk-group-heading]]:tracking-widest",
      "[&_[cmdk-group-heading]]:text-muted-foreground/60",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

/* Separador */
const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("mx-2 my-1 h-px bg-border/60", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/* Item individual */
const CommandItem = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "data-[selected=true]:bg-muted dark:data-[selected=true]:bg-slate-800/70",
      "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

/* Shortcut (texto de atajo a la derecha) */
const CommandShortcut = ({ className, ...props }) => {
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 items-center rounded-md border border-border/60 bg-muted/60 dark:bg-slate-800/60 px-1.5 text-[10px] font-bold tracking-wide text-muted-foreground/80",
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
