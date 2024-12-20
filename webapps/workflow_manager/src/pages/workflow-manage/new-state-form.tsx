// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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

export const NewStateForm = ({ workflowId }: { workflowId: number }) => {
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  });

  const workflowStore = useWorkflowStore();

  const isSubmitting = [
    ...workflowStore.requestStatus.createState.values(),
  ].some((status) => status === "LOADING");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (newState) => {
          if (await workflowStore.createState({ newState, workflowId }))
            form.reset();
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State name</FormLabel>
              <FormControl>
                <Input placeholder="my-state" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={isSubmitting}>
          Submit
        </Button>
      </form>
    </Form>
  );
};
