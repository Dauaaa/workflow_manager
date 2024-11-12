import { FormSubmitter } from "@/components/form-submitter";
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
  WorkflowAttributeReferenceTypePretty,
  WorkflowAttributeTypePretty,
  WORKFLOW_ATTRIBUTE_REFERENCE_TYPES,
  WORKFLOW_ATTRIBUTE_TYPES,
} from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { observer } from "mobx-react-lite";
import { useForm, UseFormReturn } from "react-hook-form";
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
      </Tabs>
    );
  },
);

const NewAttributeDescriptionFormSchema =
  parsers.RequestNewAttributeDescriptionSchema;
type NewAttributeDescriptionFormType = z.infer<
  typeof NewAttributeDescriptionFormSchema
>;

export const NewAttributeDescriptionForm = ({
  workflowId,
}: {
  workflowId: number;
}) => {
  const form = useForm<NewAttributeDescriptionFormType>({
    resolver: zodResolver(NewAttributeDescriptionFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const workflowStore = useWorkflowStore();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((description) => {
          workflowStore.createAttributeDescription({
            workflowId,
            ...description,
          });
        })}
        className="space-y-8"
      >
        <NameField form={form} />
        <RefTypeField form={form} />
        <AttrType form={form} />
        <FormSubmitter
          schema={NewAttributeDescriptionFormSchema}
          form={form as any}
        >
          Submit
        </FormSubmitter>
      </form>
    </Form>
  );
};

interface CommonAttributeDescriptionFieldProps {
  form: UseFormReturn<NewAttributeDescriptionFormType>;
}

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
            {...field}
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
          <Select {...field} onValueChange={field.onChange}>
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
          <Select {...field} onValueChange={field.onChange}>
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
