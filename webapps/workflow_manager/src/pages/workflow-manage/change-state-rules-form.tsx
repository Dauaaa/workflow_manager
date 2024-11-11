import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/context";
import { parsers, WorkflowState } from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { CubeIcon, TrashIcon } from "@radix-ui/react-icons";
import { observer } from "mobx-react-lite";
import * as React from "react";
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
    const [curToState, setCurToState] = React.useState<
      WorkflowState | undefined
    >();

    return (
      <div className="flex flex-col font-mono gap-4 w-full">
        <h2 className="text-xl font-bold">Configure change state rules</h2>
        {states && curState ? (
          <>
            <EditChangeRuleForm
              curState={curState}
              states={states}
              curToState={curToState}
              setCurToState={setCurToState}
            />
            <EditChangeRuleList
              curState={curState}
              states={states}
              curToState={curToState}
              setCurToState={setCurToState}
            />
          </>
        ) : null}
      </div>
    );
  },
);

interface CommonProps {
  states: Map<number, WorkflowState>;
  curState: WorkflowState;
  curToState?: WorkflowState;
  setCurToState: React.Dispatch<
    React.SetStateAction<WorkflowState | undefined>
  >;
}

const SetChangeRuleFormSchema = parsers.RequestSetChangeStateRuleSchema;
type SetChangeRuleFormType = z.infer<typeof SetChangeRuleFormSchema>;

const EditChangeRuleList = observer(
  ({ states, curState, curToState, setCurToState }: CommonProps) => {
    const statesIdWithRule = new Set(
      curState.changeRules.map((rule) => rule.toId),
    );
    const statesWithRule = [...states.values()]
      .filter((state) => statesIdWithRule.has(state.id))
      .sort((a, b) => a.id - b.id);
    return (
      <Card className="flex flex-col font-mono p-4">
        <CardTitle>States with defined rules</CardTitle>
        <CardDescription>
          These states have rules defined from {curState.name ?? "-"}
        </CardDescription>
        <CardContent className="flex flex-col gap-4 mt-4">
          {statesWithRule.map((state) => (
            <div
              key={state.id}
              className={cn(
                "border rounded-3xl px-8 py-4 text-xl font-bold w-72 line-clamp-1 hover:bg-accent hover:cursor-pointer",
                {
                  "bg-accent": curToState?.id === state.id,
                },
              )}
              onClick={() => setCurToState(state)}
            >
              {state.name}
            </div>
          ))}
          {statesWithRule.length === 0 ? (
            <div className="flex flex-col">
              <CubeIcon className="w-20 h-20 mx-auto" />
              <p className="font-bold mx-auto">No states with defined rule</p>
            </div>
          ) : null}
        </CardContent>
        {curToState ? (
          <CardFooter>Editting {curToState.name}</CardFooter>
        ) : null}
      </Card>
    );
  },
);

const EditChangeRuleForm = observer(
  ({ states, curState, setCurToState, curToState }: CommonProps) => {
    const workflowStore = useWorkflowStore();

    const form = useForm<SetChangeRuleFormType>({
      resolver: zodResolver(SetChangeRuleFormSchema),
      defaultValues: {
        expressions: ["true"],
      },
    });

    React.useEffect(() => {
      if (curToState && form.getValues().toId !== curToState.id) {
        form.setValue("toId", curToState.id);
      }
    }, [curToState, form, curState]);

    const toStateId = form.watch("toId");

    React.useEffect(() => {
      setCurToState(workflowStore.workflowStates.get(toStateId));
      form.setValue(
        "expressions",
        curState?.changeRules.find((rule) => rule.toId === toStateId)
          ?.expressions ?? ["true"],
      );
    }, [setCurToState, toStateId]);

    return (
      <Form {...form}>
        <form
          className="font-mono"
          onSubmit={form.handleSubmit(async (rule) => {
            await workflowStore.setChangeRule({
              workflowStateId: curState.id,
              rule,
            });
            form.reset();
          })}
        >
          <StatePickField form={form} states={states} curState={curState} />
          {toStateId ? (
            <ExpressionsField form={form} states={states} curState={curState} />
          ) : null}
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  },
);

interface ChangeStateRuleCommonProps {
  states: Map<number, WorkflowState>;
  curState: WorkflowState;
  form: UseFormReturn<SetChangeRuleFormType>;
}

const StatePickField = observer(
  ({ states, curState, form }: ChangeStateRuleCommonProps) => {
    return (
      <FormField
        control={form.control}
        name="toId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Change move state rules</FormLabel>
            <FormDescription>
              Add or edit rules defining how entities move between states
            </FormDescription>
            <FormControl>
              <Select
                {...field}
                onValueChange={(v) => field.onChange(Number(v))}
                value={
                  !field.value && field.value !== 0
                    ? ""
                    : field.value.toString()
                }
              >
                <div className="flex relative w-fit">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pick a state" />
                  </SelectTrigger>
                  <Button
                    onClick={() => field.onChange(undefined)}
                    className="absolute right-0"
                    variant="destructive"
                  >
                    X
                  </Button>
                </div>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>States</SelectLabel>
                    {[...states.values()]
                      .filter((state) => state.id !== curState.id)
                      .sort((a, b) => a.id - b.id)
                      .map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
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
      <FormLabel className="flex justify-between">
        <span className="mt-auto">Rules</span>
        <Button
          onClick={(e) => {
            fieldArray.append("true");
            e.preventDefault();
          }}
        >
          Add expression
        </Button>
      </FormLabel>
      <div className="flex flex-col gap-6">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="flex justify-between">
            <Textarea
              className="w-full h-40"
              {...form.register(`expressions.${index}`)}
            />
            <Button
              disabled={fieldArray.fields.length === 1}
              onClick={(e) => {
                e.preventDefault();
                fieldArray.remove(index);
              }}
              variant="destructive"
              className="h-40"
            >
              <TrashIcon />
            </Button>
          </div>
        ))}
        <FormMessage />
      </div>
    </FormItem>
  );
};
