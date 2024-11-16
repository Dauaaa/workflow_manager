import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflowStore } from "@/store/context";
import {
  parsers,
  WorkflowAttributeType,
  WorkflowAttributeTypePretty,
  WorkflowState,
  WorkflowStore,
  WORKFLOW_ATTRIBUTE_REFERENCE_TYPES,
} from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { CubeIcon, TrashIcon } from "@radix-ui/react-icons";
import { InfoIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const ChangeStateRulesForm = observer(
  ({ workflowId, stateId }: { workflowId: number; stateId: number }) => {
    const workflowStore = useWorkflowStore();

    const states = workflowStore.workflowStatesByWorkflow.get(workflowId);
    const curState = states ? states.get(stateId) : undefined;

    return (
      <div className="flex flex-col font-mono gap-4 w-full">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info!</AlertTitle>
          <AlertDescription>
            Change state rules are used to verify if an entity can move from one
            state to another
          </AlertDescription>
        </Alert>
        {states && curState ? (
          <Tabs
            defaultValue={
              curState.changeRules.length === 0 ? "NEW_RULE" : "EDIT_RULE"
            }
          >
            <TabsList>
              <TabsTrigger value="NEW_RULE">New rule</TabsTrigger>
              <TabsTrigger value="EDIT_RULE">Edit existing rule</TabsTrigger>
            </TabsList>
            <TabsContent value="NEW_RULE">
              <NewChangeRuleForm
                curState={curState}
                states={states}
                workflowId={workflowId}
              />
            </TabsContent>
            <TabsContent value="EDIT_RULE">
              <EditChangeRuleList
                states={states}
                curState={curState}
                workflowId={workflowId}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    );
  },
);

interface CommonProps {
  states: Map<number, WorkflowState>;
  curState: WorkflowState;
  workflowId: number;
}

const SetChangeRuleFormSchema = parsers.RequestSetChangeStateRuleSchema;
type SetChangeRuleFormType = z.infer<typeof SetChangeRuleFormSchema>;

const EditChangeRuleList = observer(
  ({ states, curState, workflowId }: CommonProps) => {
    const [curToState, setCurToState] = React.useState<
      WorkflowState | undefined
    >();

    const statesIdWithRule = new Set(
      curState.changeRules.map((rule) => rule.toId),
    );

    const statesWithRule = [...states.values()]
      .filter((state) => statesIdWithRule.has(state.id))
      .sort((a, b) => a.id - b.id);

    return curToState ? (
      <EditChangeRuleForm
        setCurToState={setCurToState}
        curState={curState}
        curToState={curToState}
        workflowId={workflowId}
      />
    ) : (
      <Card className="flex flex-col font-mono p-4">
        <CardTitle>States with defined rules</CardTitle>
        <CardDescription>
          These states have rules defined for {curState.name ?? "-"}
        </CardDescription>
        <CardContent className="flex flex-col gap-4 mt-4">
          {statesWithRule.map((state) => (
            <div
              key={state.id}
              className="border rounded-3xl px-8 py-4 text-xl font-bold w-72 line-clamp-1 hover:bg-accent hover:cursor-pointer"
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
      </Card>
    );
  },
);

const EditChangeRuleForm = observer(
  ({
    curState,
    curToState,
    setCurToState,
    workflowId,
  }: {
    curState: WorkflowState;
    curToState: WorkflowState;
    setCurToState: React.Dispatch<
      React.SetStateAction<WorkflowState | undefined>
    >;
    workflowId: number;
  }) => {
    const workflowStore = useWorkflowStore();
    const curRule = curState.changeRules.find(
      (rule) => rule.toId === curToState.id,
    );

    const form = useForm<SetChangeRuleFormType>({
      resolver: zodResolver(SetChangeRuleFormSchema),
      defaultValues: curRule,
    });

    if (!curRule) {
      setCurToState(undefined);
      return null;
    }

    const isSubmitting = [
      ...workflowStore.requestStatus.setChangeRule.values(),
    ].some((status) => status === "LOADING");

    return (
      <Card className="p-4">
        <CardTitle>Editing rules for state: {curState.name}</CardTitle>
        <CardDescription>
          Rules define the conditions necessary for an entity to move from one
          state to another.
        </CardDescription>
        <CardContent className="p-2">
          <Form {...form}>
            <form
              className="font-mono"
              onSubmit={form.handleSubmit(async (rule) => {
                await workflowStore.setChangeRule({
                  workflowStateId: curState.id,
                  rule,
                });
                setCurToState(undefined);
              })}
            >
              <ExpressionsField form={form} workflowId={workflowId} />
              <div className="flex justify-between py-4">
                <Button type="submit" loading={isSubmitting}>
                  Submit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setCurToState(undefined)}
                >
                  Cancel edit
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  },
);

const NewChangeRuleForm = observer(
  ({ states, curState, workflowId }: CommonProps) => {
    const workflowStore = useWorkflowStore();

    const form = useForm<SetChangeRuleFormType>({
      resolver: zodResolver(SetChangeRuleFormSchema),
      defaultValues: {
        expressions: ["true"],
        expressionNames: ["rule-1"],
      },
    });

    const toStateId = form.watch("toId");

    const isSubmitting = [
      ...workflowStore.requestStatus.setChangeRule.values(),
    ].some((status) => status === "LOADING");

    return (
      <Card className="p-4">
        <CardTitle>Creating new rules</CardTitle>
        <CardDescription>
          Rules define the conditions necessary for an entity to move from one
          state to another.
        </CardDescription>
        <CardContent className="p-2">
          <Form {...form}>
            <form
              className="font-mono"
              onSubmit={form.handleSubmit(async (rule) => {
                if (
                  await workflowStore.setChangeRule({
                    workflowStateId: curState.id,
                    rule,
                  })
                )
                  form.reset();
              })}
            >
              <StatePickField form={form} states={states} curState={curState} />
              {toStateId ? (
                <ExpressionsField form={form} workflowId={workflowId} />
              ) : null}
              <Button className="mt-4" type="submit" loading={isSubmitting}>
                Submit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
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
    const statesWithRule = curState.changeRules.map((rule) => rule.toId);
    const stateList = [...states.values()]
      .filter((state) => state.id !== curState.id)
      .sort((a, b) => a.id - b.id);

    return statesWithRule.length === states.size - 1 ? (
      <div className="w-full flex flex-col">
        <CubeIcon className="h-20 w-20 mx-auto" />
        <span className="text-xl text-center">
          All states have rules defined. Go to edit page.
        </span>
      </div>
    ) : (
      <FormField
        control={form.control}
        name="toId"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={
                  !field.value && field.value !== 0
                    ? ""
                    : field.value.toString()
                }
              >
                <Label htmlFor="state-picker">
                  Pick the state an entity will move to
                </Label>
                <div className="flex relative w-fit">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue id="state-picker" placeholder="Pick a state" />
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
                    {stateList.map((state) => (
                      <SelectItem
                        key={state.id}
                        value={state.id.toString()}
                        disabled={statesWithRule.includes(state.id)}
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

interface AttributeInfo {
  name: string;
  type: WorkflowAttributeType;
}
const organizeAttributeInformation = (
  info?: WorkflowStore["attributeDescriptionsByWorkflows"] extends Map<
    number,
    infer T
  >
    ? T
    : never,
): AttributeInfo[] => {
  if (!info) return [];

  const res: AttributeInfo[] = [];

  for (const refType of WORKFLOW_ATTRIBUTE_REFERENCE_TYPES)
    for (const description of info[refType].values())
      switch (description.refType) {
        case "WORKFLOW":
          res.push({
            name: "w_" + description.name,
            type: description.attrType,
          });
          break;
        case "WORKFLOW_STATE":
          res.push({
            name: "fs_" + description.name,
            type: description.attrType,
          });
          res.push({
            name: "ts_" + description.name,
            type: description.attrType,
          });
          break;
        case "WORKFLOW_ENTITY":
          res.push({
            name: "e_" + description.name,
            type: description.attrType,
          });
      }

  return res;
};

const ExpressionsField = ({
  form,
  workflowId,
}: {
  form: UseFormReturn<SetChangeRuleFormType>;
  workflowId: number;
}) => {
  const expressionNamesFields = useFieldArray({
    name: "expressionNames",
  });
  const expressionsFields = useFieldArray({
    name: "expressions",
  });
  const workflowStore = useWorkflowStore();

  const attrs = organizeAttributeInformation(
    workflowStore.attributeDescriptionsByWorkflows.get(workflowId),
  );

  const expressionNames = form.watch("expressionNames");

  return (
    <Dialog>
      <FormItem>
        <FormLabel className="flex justify-between">
          <span className="mt-auto">Rules</span>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-sm p-1 md:text-base md:px-4 md:py-2"
              >
                Variable Names
              </Button>
            </DialogTrigger>
            <Button
              onClick={(e) => {
                expressionNamesFields.append(
                  "rule-" + (expressionNamesFields.fields.length + 1),
                );
                expressionsFields.append("true");
                e.preventDefault();
              }}
              variant="outline"
              className="text-sm p-1 md:text-base md:px-4 md:py-2"
            >
              Add expression
            </Button>
          </div>
        </FormLabel>
        <div className="flex flex-col gap-6">
          {expressionNamesFields.fields.map((expressionNameField, index) => (
            <div
              key={expressionNameField.id}
              className="flex justify-between gap-2"
            >
              <Collapsible className="flex-grow">
                <CollapsibleTrigger asChild>
                  <div className="p-4 rounded-xl text-xl hover:bg-accent cursor-pointer border-2 border-accent w-full h-20">
                    <h3 className="h-full flex flex-col justify-center">
                      {expressionNames[index]}
                    </h3>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-4 border-x-2 rounded-b-xl border-b-2 p-2">
                    <div>
                      <Label htmlFor={`name-${expressionNameField.id}`}>
                        Name of the CEL expression
                      </Label>
                      <Input
                        id={`name-${expressionNameField.id}`}
                        {...form.register(`expressionNames.${index}`)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`expression-${expressionNameField.id}`}>
                        Value of the CEL expression
                      </Label>
                      <Textarea
                        id={`expression-${expressionNameField.id}`}
                        className="w-full h-40"
                        {...form.register(`expressions.${index}`)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Button
                disabled={expressionNamesFields.fields.length === 1}
                onClick={(e) => {
                  e.preventDefault();
                  expressionNamesFields.remove(index);
                  expressionsFields.remove(index);
                }}
                variant="destructive"
                className="h-20"
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
          <FormMessage />
        </div>
      </FormItem>
      <DialogContent className="max-h-[60vh] overflow-y-auto">
        <DialogTitle>The attributes available in the rule</DialogTitle>
        <DialogDescription>
          Reference the value of these attributes using their names (listed
          below) when writing a rule. Their values will be injected when
          resolving the rule. All attributes reference one of these: workflow (
          <span className="bg-accent font-bold text-accent-foreground font-mono">
            w_
          </span>
          ) from state (
          <span className="bg-accent font-bold text-accent-foreground font-mono">
            fs_
          </span>
          ) to state (
          <span className="bg-accent font-bold text-accent-foreground font-mono">
            ts_
          </span>
          ) and entity (
          <span className="bg-accent font-bold text-accent-foreground font-mono">
            e_
          </span>
          )
        </DialogDescription>
        <div className="flex flex-wrap font-mono gap-4">
          {attrs.map((attr) => (
            <span
              key={attr.name}
              className="h-12 border-l-2 border-l-accent flex flex-col justify-center pl-2 min-w-40"
            >
              {attr.name} - {WorkflowAttributeTypePretty[attr.type]}
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
