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

const FormSchema = z.object({
  initialStateId: z.coerce.number().nullish(),
});

type FormType = z.infer<typeof FormSchema>;

export const SetConfigForm = observer(
  ({
    buttonOverride,
    workflowId,
  }: {
    buttonOverride?: React.ReactNode;
    workflowId: number;
  }) => {
    const workflowStore = useWorkflowStore();

    // TODO: decide how this should be loaded (cache vs page aware of necessary loads)
    const workflow = workflowStore.workflows.get(workflowId);
    const workflowStates =
      workflowStore.workflowStatesByWorkflow.get(workflowId);

    return workflow && workflowStates ? (
      <SetConfigFormInner
        workflow={workflow}
        states={[...workflowStates.values()]}
      />
    ) : null;
  },
);

const SetConfigFormInner = observer(
  ({
    buttonOverride,
    states,
    workflow,
  }: {
    buttonOverride?: React.ReactNode;
    states: WorkflowState[];
    workflow: Workflow;
  }) => {
    const form = useForm<FormType>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        initialStateId: workflow.initialStateId,
      },
    });

    const workflowStore = useWorkflowStore();

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((config) =>
            workflowStore.setWorkflowConfig(workflow.id, config),
          )}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="initialStateId"
            render={({ field }) =>
              (() => {
                console.log(field);
                return false;
              })() || (
                <FormItem>
                  <FormLabel>Initial state for the workflow</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
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
              )
            }
          />
          {buttonOverride ?? <Button type="submit">Submit</Button>}
        </form>
      </Form>
    );
  },
);
