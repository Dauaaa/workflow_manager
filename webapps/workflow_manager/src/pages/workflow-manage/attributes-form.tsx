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
import { CubeIcon, UpdateIcon } from "@radix-ui/react-icons";
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
      <div className="flex gap-x-16 gap-y-8 flex-wrap">
        {descriptions.map((desc) => (
          <SetAttributeForm
            baseEntityId={baseEntityId}
            descriptionName={desc.name}
            refType={refType}
            workflowId={workflowId}
            key={desc.name}
          />
        ))}
        {descriptions.length === 0 ? (
          <div className="flex flex-col my-auto gap-2 w-full">
            <CubeIcon className="h-20 w-20 mx-auto" />
            <p className="text-center font-mono">No attributes.</p>
            <p className="text-center font-mono">
              Create attributes in the workflow menu.
            </p>
          </div>
        ) : null}
      </div>
    );
  },
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
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2 w-96">
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
