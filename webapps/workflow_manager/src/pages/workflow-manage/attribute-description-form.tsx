import * as React from "react";
import { FormSubmitter } from "@/components/form-submitter";
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
import { useWorkflowStore } from "@/store/context";
import {
  parsers,
  WorkflowAttributeReferenceType,
  WorkflowAttributeReferenceTypePretty,
  WorkflowAttributeTypePretty,
  WORKFLOW_ATTRIBUTE_REFERENCE_TYPES,
  WORKFLOW_ATTRIBUTE_TYPES,
} from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const AttributeDescriptionManager = observer(
  ({ workflowId }: { workflowId: number }) => {
    return (
      <Tabs defaultValue="NEW_DESCRIPTION">
        <TabsList className="flex justify-start w-full">
          <TabsTrigger value="WORKFLOW">Workflow</TabsTrigger>
          <TabsTrigger value="WORKFLOW_STATE">State</TabsTrigger>
          <TabsTrigger value="WORKFLOW_ENTITY">Entity</TabsTrigger>
          <TabsTrigger value="NEW_DESCRIPTION">New Attribute</TabsTrigger>
        </TabsList>
        <TabsContent className="font-mono" value="NEW_DESCRIPTION">
          <NewAttributeDescriptionForm workflowId={workflowId} />
        </TabsContent>
        <TabsContent value="WORKFLOW">
          <DisplayAttributeDescriptions
            workflowId={workflowId}
            refType="WORKFLOW"
          />
        </TabsContent>
        <TabsContent value="WORKFLOW_STATE">
          <DisplayAttributeDescriptions
            workflowId={workflowId}
            refType="WORKFLOW_STATE"
          />
        </TabsContent>
        <TabsContent value="WORKFLOW_ENTITY">
          <DisplayAttributeDescriptions
            workflowId={workflowId}
            refType="WORKFLOW_ENTITY"
          />
        </TabsContent>
      </Tabs>
    );
  },
);

const DisplayAttributeDescriptions = ({
  workflowId,
  refType,
}: {
  workflowId: number;
  refType: WorkflowAttributeReferenceType;
}) => {
  const workflowStore = useWorkflowStore();

  const descriptions = [
    ...(workflowStore.attributeDescriptionsByWorkflows
      .get(workflowId)
      ?.[refType].values() ?? []),
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {descriptions.map((description) => (
        <span
          key={description.name}
          className="font-mono p-4 border-l-2 border-l-accent text-xl font-semibold"
        >
          {description.name} -{" "}
          {WorkflowAttributeTypePretty[description.attrType]}
        </span>
      ))}
    </div>
  );
};

const NewAttributeDescriptionFormSchema =
  parsers.RequestNewAttributeDescriptionSchema;
type NewAttributeDescriptionFormType = z.infer<
  typeof NewAttributeDescriptionFormSchema
>;

export const NewAttributeDescriptionForm = observer(
  ({ workflowId }: { workflowId: number }) => {
    const form = useForm<NewAttributeDescriptionFormType>({
      resolver: zodResolver(NewAttributeDescriptionFormSchema),
      defaultValues: {
        name: "",
      },
    });

    const workflowStore = useWorkflowStore();

    const isSubmitting = [
      ...workflowStore.requestStatus.createAttributeDescription.values(),
    ].some((status) => status === "LOADING");

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (description) => {
            if (
              await workflowStore.createAttributeDescription({
                workflowId,
                ...description,
              })
            )
              form.reset();
          })}
          className="space-y-8"
        >
          <NameField form={form} />
          <RefTypeField form={form} />
          <AttrType form={form} />
          <SimpleRule form={form} />
          <FormSubmitter
            schema={NewAttributeDescriptionFormSchema}
            form={form as any}
            loading={isSubmitting}
          >
            Submit
          </FormSubmitter>
        </form>
      </Form>
    );
  },
);

interface CommonAttributeDescriptionFieldProps {
  form: UseFormReturn<NewAttributeDescriptionFormType>;
}

const SimpleRule = ({ form }: CommonAttributeDescriptionFieldProps) => {
  const attrType = form.getValues("attrType");

  React.useEffect(() => {
    if (attrType !== "TEXT") form.resetField("maxLength");
    if (attrType === "ENUMERATION") form.setValue("enumDescription", [""]);
    else form.resetField("enumDescription");
  }, [form, attrType]);

  switch (attrType) {
    case "TEXT":
      return <MaxLengthField form={form} />;
    case "ENUMERATION":
      return <EnumerationField form={form} />;
  }

  return null;
};

const MaxLengthField = ({ form }: CommonAttributeDescriptionFieldProps) => (
  <FormField
    control={form.control}
    name="maxLength"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Max length of text</FormLabel>
        <FormControl>
          <Input
            placeholder="256"
            value={field.value?.toString() ?? ""}
            onChange={(e) => {
              const parsedField = e.target.value.replaceAll(/\D/g, "");
              field.onChange(parsedField === "" ? undefined : parsedField);
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const EnumerationField = ({ form }: CommonAttributeDescriptionFieldProps) => {
  const fieldArray = useFieldArray({
    name: "enumDescription",
  });

  return (
    <FormItem>
      <FormLabel className="flex justify-between">
        <span className="mt-auto">Enum values</span>
        <Button
          onClick={(e) => {
            fieldArray.append("");
            e.preventDefault();
          }}
          variant="outline"
        >
          Add enum
        </Button>
      </FormLabel>
      <div className="flex flex-col gap-6">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="flex justify-between">
            <Input
              placeholder="my-enum"
              {...form.register(`enumDescription.${index}`)}
            />
            <Button
              disabled={fieldArray.fields.length === 1}
              onClick={(e) => {
                e.preventDefault();
                fieldArray.remove(index);
              }}
              variant="destructive"
              icon={<TrashIcon />}
            />
          </div>
        ))}
        <FormMessage />
      </div>
    </FormItem>
  );
};

const NameField = ({ form }: CommonAttributeDescriptionFieldProps) => (
  <FormField
    control={form.control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Attribute name</FormLabel>
        <FormControl>
          <Input
            placeholder="my-attribute"
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              form.trigger("name");
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const RefTypeField = ({ form }: CommonAttributeDescriptionFieldProps) => (
  <FormField
    control={form.control}
    name="refType"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Entity type</FormLabel>
        <FormControl>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {WORKFLOW_ATTRIBUTE_REFERENCE_TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty} className="font-mono">
                    {WorkflowAttributeReferenceTypePretty[ty]}
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

const AttrType = ({ form }: CommonAttributeDescriptionFieldProps) => (
  <FormField
    control={form.control}
    name="attrType"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Attribute type</FormLabel>
        <FormControl>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Attribute types</SelectLabel>
                {WORKFLOW_ATTRIBUTE_TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty} className="font-mono">
                    {WorkflowAttributeTypePretty[ty]}
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
