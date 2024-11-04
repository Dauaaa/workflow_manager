import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflowStore } from "@/store/context";
import { parsers, WorkflowState } from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "@radix-ui/react-icons";
import { observer } from "mobx-react-lite";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const ChangeStateRulesForm = observer(
  ({ workflowId, stateId }: { workflowId: number; stateId: number }) => {
    const workflowStore = useWorkflowStore();

    // TODO: uncomment after patched store to allow calling
    // multiple times without making multiple requests
    // useEffect(() => {
    //   void workflowStore.loadAttributeDescriptions(workflowId);
    //   void workflowStore.loadStates(workflowId);
    // }, []);

    const states = workflowStore.workflowStatesByWorkflow.get(workflowId);
    const curState = states ? states.get(stateId) : undefined;

    return (
      <div className="flex flex-col font-mono gap-4">
        <h2 className="text-xl font-bold">Configure change state rules</h2>
        {states && curState ? (
          <AddChangeRuleForm curState={curState} states={states} />
        ) : null}
      </div>
    );
  },
);

const AddChangeRuleFormSchema = parsers.RequestSetChangeStateRuleSchema;
type AddChangeRuleFormType = z.infer<typeof AddChangeRuleFormSchema>;

const AddChangeRuleForm = observer(
  ({
    states,
    curState,
  }: {
    states: Map<number, WorkflowState>;
    curState: WorkflowState;
  }) => {
    const workflowStore = useWorkflowStore();

    const form = useForm<AddChangeRuleFormType>({
      resolver: zodResolver(AddChangeRuleFormSchema),
      defaultValues: {
        expressions: ["true"],
      },
    });

    return (
      <Form {...form}>
        <form
          className="font-mono"
          onSubmit={form.handleSubmit((rule) =>
            workflowStore.setChangeRule({
              workflowStateId: curState.id,
              rule,
            }),
          )}
        >
          <StatePickField form={form} states={states} curState={curState} />
          <ExpressionsField form={form} states={states} curState={curState} />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
);

interface ChangeStateRuleCommonProps {
  states: Map<number, WorkflowState>;
  curState: WorkflowState;
  form: UseFormReturn<AddChangeRuleFormType>;
}

const StatePickField = observer(
  ({ states, curState, form }: ChangeStateRuleCommonProps) => {
    const curRulesByToId = new Map(
      curState.changeRules.map((rule) => [rule.toId, rule]),
    );
    return (
      <FormField
        control={form.control}
        name="toId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>To state</FormLabel>
            <FormControl>
              <Select
                {...field}
                onValueChange={(v) => field.onChange(Number(v))}
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
                    {[...states.values()]
                      .filter((state) => state.id !== curState.id)
                      .map((state) => (
                        <SelectItem
                          key={state.id}
                          value={state.id.toString()}
                          disabled={curRulesByToId.has(state.id)}
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
    );
  },
);

const ExpressionsField = ({ form }: ChangeStateRuleCommonProps) => {
  const fieldArray = useFieldArray({
    name: "expressions",
  });

  return (
    <FormItem>
      <FormLabel>Rules</FormLabel>
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="flex justify-between">
          <Textarea
            className="w-32 h-32"
            {...form.register(`expressions.${index}`)}
          />
          <Button
            disabled={fieldArray.fields.length === 1}
            onClick={(e) => {
              e.preventDefault();
              fieldArray.remove(index);
            }}
          >
            <TrashIcon className="text-destructive-foreground" />
          </Button>
        </div>
      ))}
      <Button
        onClick={(e) => {
          fieldArray.append("true");
          e.preventDefault();
        }}
      >
        Add expression
      </Button>
      <FormMessage />
    </FormItem>
  );
};
