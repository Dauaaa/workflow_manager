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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/context";
import {
  parsers,
  WorkflowAttribute,
  WorkflowAttributeDescription,
  WorkflowAttributeReferenceType,
  WorkflowAttributeReferenceTypePretty,
  WorkflowAttributeType,
  WorkflowAttributeTypePretty,
  WORKFLOW_ATTRIBUTE_REFERENCE_TYPES,
  WORKFLOW_ATTRIBUTE_TYPES,
} from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateIcon } from "@radix-ui/react-icons";
import Decimal from "decimal.js";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { ControllerRenderProps, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormSubmitter } from "@/components/form-submitter";

export const AttributesForm = observer(
  ({
    workflowId,
    refType,
    baseEntityId,
  }: {
    workflowId: number;
    refType: WorkflowAttributeReferenceType;
    baseEntityId: number;
  }) => {
    const workflowStore = useWorkflowStore();

    React.useEffect(() => {
      void workflowStore.loadAttributeDescriptions(workflowId);
      void workflowStore.loadAttributes({
        workflowId,
        baseEntityId,
        refType,
      });
    }, []);

    const descriptions = [
      ...(workflowStore.attributeDescriptionsByWorkflows
        .get(workflowId)
        ?.[refType].values() ?? []),
    ];

    return (
      <div className="flex flex-col gap-8 font-mono">
        <Popover>
          <PopoverTrigger asChild>
            <Button>Add attribute</Button>
          </PopoverTrigger>
          <PopoverContent onClick={(e) => e.stopPropagation()}>
            <NewAttributeDescriptionForm
              refType={refType}
              workflowId={workflowId}
            />
          </PopoverContent>
        </Popover>
        {descriptions.map((desc) => (
          <SetAttributeForm
            baseEntityId={baseEntityId}
            descriptionName={desc.name}
            refType={refType}
            workflowId={workflowId}
            key={desc.name}
          />
        ))}
      </div>
    );
  },
);

const NewAttributeDescriptionFormSchema =
  parsers.RequestNewAttributeDescriptionSchema;
type NewAttributeDescriptionFormType = z.infer<
  typeof NewAttributeDescriptionFormSchema
>;

const NewAttributeDescriptionForm = ({
  workflowId,
  refType,
}: {
  workflowId: number;
  refType: WorkflowAttributeReferenceType;
}) => {
  const form = useForm<NewAttributeDescriptionFormType>({
    resolver: zodResolver(NewAttributeDescriptionFormSchema),
    defaultValues: {
      refType,
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
          closeContext="popover"
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
          <Select {...field} open={false}>
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

const SetAttributeFormSchema = parsers.RequestNewAttributeSchema;
type SetAttributeFormType = z.input<typeof SetAttributeFormSchema>;

const SetAttributeForm = (props: {
  refType: WorkflowAttributeReferenceType;
  workflowId: number;
  descriptionName: string;
  baseEntityId: number;
}) => {
  const form = useForm<SetAttributeFormType>({
    resolver: zodResolver(SetAttributeFormSchema),
    defaultValues: {},
  });

  const workflowStore = useWorkflowStore();

  const description = workflowStore.getAttributeDescription(props);
  const attr = workflowStore.getAttribute(props);

  return description ? (
    <Form {...form}>
      <form>
        <AttrField
          description={description}
          attr={attr}
          form={form}
          baseEntityId={props.baseEntityId}
        />
      </form>
    </Form>
  ) : null;
};

interface CommonAttributeFormFieldProps {
  form: UseFormReturn<SetAttributeFormType>;
  attr?: WorkflowAttribute;
  description: WorkflowAttributeDescription;
  baseEntityId: number;
}

const AttrField = observer((props: CommonAttributeFormFieldProps) => {
  const workflowStore = useWorkflowStore();

  const name = WorkflowAttributeTypePretty[props.description.attrType];
  const formLabel = `${props.description.name} - ${WorkflowAttributeTypePretty[props.description.attrType]}`;

  const attr = workflowStore.getAttribute({
    baseEntityId: props.baseEntityId,
    refType: props.description.refType,
    descriptionName: props.description.name,
  });

  const curValue =
    attr?.[WorkflowAttributeTypePretty[props.description.attrType]];

  React.useEffect(() => {
    props.form.setValue(
      WorkflowAttributeTypePretty[props.description.attrType],
      curValue,
    );
  }, [curValue]);

  return (
    <>
      {name === "enumeration" ? (
        <FormField
          control={props.form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2">
              <FormLabel>{formLabel}</FormLabel>
              <FormControl>
                <EnumField {...props} field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {name === "text" ||
      name === "integer" ||
      name === "decimal" ||
      name === "floating" ? (
        <FormField
          control={props.form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2">
              <FormLabel>{formLabel}</FormLabel>
              <FormControl>
                <TextField {...props} field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {name === "flag" ? (
        <FormField
          control={props.form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2">
              <FormLabel>{formLabel}</FormLabel>
              <FormControl>
                <FlagField {...props} field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {name === "date" ? ( // TODO
        <FormField
          control={props.form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2">
              <FormLabel>{formLabel}</FormLabel>
              <FormControl>
                {/* <FlagField {...props} field={field} /> */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {name === "timestamp" ? ( // TODO
        <FormField
          control={props.form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2">
              <FormLabel>{formLabel}</FormLabel>
              <FormControl>
                {/* <FlagField {...props} field={field} /> */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </>
  );
});

const FlagField = ({
  field,
  form,
  description,
  baseEntityId,
  attr,
}: CommonAttributeFormFieldProps & {
  field: ControllerRenderProps<SetAttributeFormType, "flag">;
}) => {
  const value = form.watch("flag");
  const workflowStore = useWorkflowStore();

  React.useEffect(() => {
    if (attr?.flag !== value)
      void form.handleSubmit((attr) => {
        workflowStore.setAttribute({
          refType: description.refType,
          baseEntityId,
          attributeName: description.name,
          attr: attr as any,
        });
      })();
  }, [value]);

  return (
    <div className="flex justify-start gap-4 align-bottom">
      <span
        className={cn("transition-all duration-150", {
          "opacity-50": value,
        })}
      >
        false
      </span>
      <Switch checked={field.value} onCheckedChange={field.onChange} />
      <span
        className={cn("transition-all duration-150", {
          "opacity-50": !value,
        })}
      >
        true
      </span>
    </div>
  );
};

const textInputToFieldValue = (
  attrType: WorkflowAttributeType,
  value?: string,
) => {
  let ret;
  switch (attrType) {
    case "TEXT":
      ret = { value };
      break;
    case "INTEGER":
    case "DECIMAL":
    case "FLOATING": {
      if (value) {
        try {
          if (attrType === "FLOATING") {
            if (Number.isNaN(Number(value))) throw "";
            ret = { value: Number(value) };
          } else if (attrType === "INTEGER") ret = { value: BigInt(value) };
          else ret = { value: new Decimal(value) };
        } catch {
          ret = { error: true };
        }
      }
    }
  }

  return ret;
};

type TextInputType = number | string | undefined | bigint | Decimal;

const valuesEq = (a: TextInputType, b: TextInputType) => {
  if (a instanceof Decimal && b instanceof Decimal) return a.eq(b);
  return a === b;
};

const TextField = observer(
  ({
    field,
    form,
    description,
    baseEntityId,
  }: CommonAttributeFormFieldProps & {
    field: ControllerRenderProps<
      SetAttributeFormType,
      "text" | "integer" | "decimal" | "floating"
    >;
  }) => {
    const workflowStore = useWorkflowStore();
    const [strValue, setStrValue] = React.useState(
      field.value?.toString() ?? "",
    );

    React.useLayoutEffect(() => {
      setStrValue(field.value?.toString() ?? "");
    }, [field.value, setStrValue]);

    const attr = workflowStore
      .getAttributeMapByRefType(description.refType)
      .get(baseEntityId)
      ?.get(description.name);

    const disabled =
      attr?.[WorkflowAttributeTypePretty[description.attrType]] ===
        field.value ||
      !!textInputToFieldValue(description.attrType, strValue)?.error;

    const submit = () => {
      void form.handleSubmit((attr) => {
        void workflowStore.setAttribute({
          attr: attr as any,
          refType: description.refType,
          baseEntityId,
          attributeName: description.name,
        });
      })();
    };

    return (
      <div className="flex gap-4">
        <Input
          className="w-64"
          value={strValue}
          onChange={(e) => {
            setStrValue(e.target.value);
            const newValue = textInputToFieldValue(
              description.attrType,
              e.target.value,
            );
            if (!newValue?.error && !valuesEq(newValue?.value, field.value)) {
              field.onChange(newValue?.value);
            }
          }}
        />
        <Button
          onClick={(e) => {
            e.preventDefault();
            submit();
          }}
          disabled={disabled}
        >
          <UpdateIcon className="w-8 h-8" />
        </Button>
      </div>
    );
  },
);

const EnumField = ({
  field,
  form,
  description,
  baseEntityId,
  attr,
}: CommonAttributeFormFieldProps & {
  field: ControllerRenderProps<SetAttributeFormType, "enumeration">;
}) => {
  const value = form.watch("enumeration");
  const workflowStore = useWorkflowStore();

  React.useEffect(() => {
    if (attr?.enumeration !== value)
      void form.handleSubmit((attr) => {
        workflowStore.setAttribute({
          refType: description.refType,
          baseEntityId,
          attributeName: description.name,
          attr: attr as any,
        });
      })();
  }, [value]);

  return (
    <Select {...field} onValueChange={field.onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {(description.enumDescription ?? []).map((ty) => (
            <SelectItem key={ty} value={ty} className="font-mono">
              {ty}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
