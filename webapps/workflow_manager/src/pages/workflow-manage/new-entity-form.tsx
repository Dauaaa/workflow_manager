// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useWorkflowStore } from "@/store/context";
import { FormSubmitter } from "@/components/form-submitter";
import "react";

const FormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least two characters.",
    })
    .max(50, {
      message: "Name must be less than 51 characters.",
    }),
});

type FormType = z.infer<typeof FormSchema>;

export const NewEntityForm = ({
  workflowId,
  inDialog,
}: {
  workflowId: number;
  inDialog?: boolean;
}) => {
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  });

  const workflowStore = useWorkflowStore();

  const isSubmitting = [
    ...workflowStore.requestStatus.createEntity.values(),
  ].some((status) => status === "LOADING");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (newEntity) => {
          if (await workflowStore.createEntity({ newEntity, workflowId }))
            form.reset();
        })}
        className="space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entity name</FormLabel>
              <FormControl>
                <Input placeholder="my-entity" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormSubmitter
          schema={FormSchema}
          form={form as any}
          closeContext={inDialog ? "dialog" : undefined}
          loading={isSubmitting}
        >
          Submit
        </FormSubmitter>
      </form>
    </Form>
  );
};
