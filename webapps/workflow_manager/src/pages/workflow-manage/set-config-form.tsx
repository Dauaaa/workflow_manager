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
import { useWorkflowStore } from "@/store/context";
import { Workflow, WorkflowState } from "@/store/workflow-store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { observer } from "mobx-react-lite";
import "react";

const FormSchema = z.object({
  initialStateId: z.coerce.number().nullish(),
});

type FormType = z.infer<typeof FormSchema>;

export const SetConfigForm = observer(
  ({ workflowId }: { workflowId: number }) => {
    const workflowStore = useWorkflowStore();

    // TODO: decide how this should be loaded (cache vs page aware of necessary loads)
    const workflow = workflowStore.workflows.get(workflowId);
    const workflowStates =
      workflowStore.workflowStatesByWorkflow.get(workflowId) ?? [];

    return workflow ? (
      <SetConfigFormInner
        workflow={workflow}
        states={[...workflowStates.values()]}
      />
    ) : null;
  },
);

const SetConfigFormInner = observer(
  ({ states, workflow }: { states: WorkflowState[]; workflow: Workflow }) => {
    const form = useForm<FormType>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        initialStateId: workflow.initialStateId,
      },
    });

    const workflowStore = useWorkflowStore();

    const isSubmitting = [
      ...workflowStore.requestStatus.setWorkflowConfig.values(),
    ].some((status) => status === "LOADING");

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((config) =>
            workflowStore.setWorkflowConfig({
              workflowId: workflow.id,
              config,
            }),
          )}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="initialStateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial state for the workflow</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={
                      !field.value && field.value !== 0
                        ? undefined
                        : field.value.toString()
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pick a state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>States</SelectLabel>
                        {states.map((state) => (
                          <SelectItem
                            key={state.id}
                            value={state.id.toString()}
                            className="font-mono"
                          >
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
  },
);
