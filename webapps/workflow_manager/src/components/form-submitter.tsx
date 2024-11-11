import { Button } from "./ui/button";
import { z } from "zod";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { PopoverClose } from "./ui/popover";
import { DialogClose } from "./ui/dialog";

export type CloseContextType = "popover" | "dialog";

export function FormSubmitter<T extends FieldValues>({
  form,
  schema,
  closeContext,
  ...buttonProps
}: {
  form: UseFormReturn<T>;
  schema: z.Schema;
  closeContext?: CloseContextType;
} & Parameters<typeof Button>[0]) {
  const fields = form.watch();

  const button = (
    <Button
      disabled={!!schema.safeParse(fields).error || buttonProps.disabled}
      type="submit"
      {...buttonProps}
    />
  );

  if (closeContext === "popover")
    return <PopoverClose asChild>{button}</PopoverClose>;
  if (closeContext === "dialog")
    return <DialogClose asChild>{button}</DialogClose>;

  return button;
}
