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
  buttonOverride,
  workflowId,
}: {
  buttonOverride?: React.ReactNode;
  workflowId: number;
}) => {
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  });

  const workflowStore = useWorkflowStore();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((newEntity) =>
          workflowStore.createEntity(newEntity, workflowId),
        )}
        className="space-y-8"
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
        {buttonOverride ?? <Button type="submit">Submit</Button>}
      </form>
    </Form>
  );
};
