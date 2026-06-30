import { Dialog } from "@base-ui-components/react/dialog";
import { Select as BaseSelect } from "@base-ui-components/react/select";
import { Check, ChevronDown, X } from "lucide-react";
import {
  Fragment,
  Children,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#224d8e] focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-[#102a56] text-white hover:bg-[#173a70]",
        variant === "secondary" && "bg-[#fff4d6] text-[#7a4d00] hover:bg-[#ffe8ad]",
        variant === "outline" &&
          "border border-[#cfd7e4] bg-white text-[#26354d] hover:bg-[#f4f6f9]",
        variant === "ghost" && "text-[#526078] hover:bg-[#edf1f6] hover:text-[#182235]",
        variant === "danger" && "bg-[#b42318] text-white hover:bg-[#912018]",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-[#cfd7e4] bg-white px-3 text-sm text-[#182235] outline-none placeholder:text-[#98a2b3] focus:border-[#224d8e] focus:ring-2 focus:ring-[#d9e6fa] disabled:bg-[#f2f4f7]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full resize-y rounded-md border border-[#cfd7e4] bg-white px-3 py-2.5 text-sm text-[#182235] outline-none placeholder:text-[#98a2b3] focus:border-[#224d8e] focus:ring-2 focus:ring-[#d9e6fa]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectChangeEvent {
  target: {
    name?: string;
    value: string;
  };
  currentTarget: {
    name?: string;
    value: string;
  };
}

export interface SelectProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children" | "defaultValue" | "onChange" | "value"> {
  children: ReactNode;
  defaultValue?: string | number | null;
  name?: string;
  onChange?: (event: SelectChangeEvent) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value?: string | number | null;
}

function optionValue(label: ReactNode, value: unknown): string {
  if (value !== undefined && value !== null) return String(value);
  if (typeof label === "string" || typeof label === "number") return String(label);
  return "";
}

function collectSelectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === Fragment) {
      const fragmentProps = child.props as { children?: ReactNode };
      collectSelectOptions(fragmentProps.children).forEach((option) => options.push(option));
      return;
    }

    if (child.type !== "option") return;

    const props = child.props as {
      children?: ReactNode;
      disabled?: boolean;
      value?: string | number | null;
    };

    options.push({
      disabled: props.disabled,
      label: props.children,
      value: optionValue(props.children, props.value),
    });
  });

  return options;
}

function selectedOptionLabel(options: SelectOption[], value: unknown, placeholder?: string) {
  const normalized = value === undefined || value === null ? "" : String(value);
  return options.find((option) => option.value === normalized)?.label ?? placeholder ?? normalized;
}

export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      children,
      className,
      defaultValue,
      disabled,
      id,
      name,
      onChange,
      placeholder = "Select an option",
      readOnly,
      required,
      value,
      ...props
    },
    ref,
  ) => {
    const options = collectSelectOptions(children);
    const resolvedDefaultValue =
      defaultValue === undefined || defaultValue === null
        ? options[0]?.value
        : String(defaultValue);
    const rootValue = value === undefined || value === null ? undefined : String(value);
    const rootProps =
      rootValue === undefined
        ? { defaultValue: resolvedDefaultValue }
        : { value: rootValue };

    const emitChange = (nextValue: string | null | undefined) => {
      if (nextValue === null || nextValue === undefined) return;
      onChange?.({
        currentTarget: { name, value: nextValue },
        target: { name, value: nextValue },
      });
    };

    return (
      <BaseSelect.Root
        id={id}
        inputRef={ref}
        items={options}
        name={name}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        onValueChange={(nextValue) => emitChange(nextValue)}
        {...rootProps}
      >
        <BaseSelect.Trigger
          className={cn(
            "inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-[#cfd7e4] bg-white px-3 text-sm text-[#182235] shadow-xs outline-none transition-colors hover:bg-[#f8fafc] focus:border-[#224d8e] focus:ring-2 focus:ring-[#d9e6fa] disabled:pointer-events-none disabled:bg-[#f2f4f7] disabled:opacity-60",
            className,
          )}
          disabled={disabled}
          type="button"
          {...props}
        >
          <BaseSelect.Value className="min-w-0 truncate text-left">
            {(currentValue) => selectedOptionLabel(options, currentValue, placeholder)}
          </BaseSelect.Value>
          <BaseSelect.Icon className="shrink-0 text-[#667085]">
            <ChevronDown className="h-4 w-4" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            align="start"
            alignItemWithTrigger={false}
            sideOffset={4}
            className="z-50 min-w-[var(--anchor-width)]"
          >
            <BaseSelect.Popup className="max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-[#cfd7e4] bg-white p-1 text-sm text-[#182235] shadow-xl outline-none">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ disabled: itemDisabled, highlighted, selected }) =>
                      cn(
                        "relative flex cursor-default items-center rounded-sm py-2 pr-8 pl-3 outline-none select-none",
                        highlighted && "bg-[#eef3fa] text-[#102a56]",
                        selected && "font-semibold text-[#102a56]",
                        itemDisabled && "pointer-events-none opacity-50",
                      )
                    }
                  >
                    <BaseSelect.ItemText className="truncate">{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="absolute right-2 inline-flex text-[#102a56]">
                      <Check className="h-4 w-4" />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    );
  },
);
Select.displayName = "Select";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-[#344054]", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#b42318]">{children}</p>;
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", className)}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-[#dde3ec] bg-white shadow-sm", className)}>
      {children}
    </section>
  );
}

export function Alert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "success" | "info";
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "error" && "border-[#fecdca] bg-[#fef3f2] text-[#912018]",
        variant === "success" && "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",
        variant === "info" && "border-[#b2ccff] bg-[#eff4ff] text-[#1849a9]",
      )}
    >
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[#667085]">
      <span
        className="portal-spinner h-4 w-4 rounded-full border-2 border-[#cfd7e4] border-t-[#173a70]"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  footer: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#0a1b38]/55" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-[#182235]">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-[#667085]">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label="Close dialog"
                className="rounded-md p-1 text-[#667085] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#224d8e] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            {children && <div className="mt-5">{children}</div>}
            <div className="mt-6 flex justify-end gap-2">{footer}</div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
