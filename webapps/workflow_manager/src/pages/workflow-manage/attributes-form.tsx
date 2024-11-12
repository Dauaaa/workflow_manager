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
  WorkflowAttributeType,
  WorkflowAttributeTypePretty,
} from "@/store/workflow-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { CubeIcon, UpdateIcon } from "@radix-ui/react-icons";
import Decimal from "decimal.js";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { ControllerRenderProps, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/time-picker/date-time-picker";
import { Dayjs } from "dayjs";

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
      <div className="flex flex-col md:flex-row gap-x-16 gap-y-8 md:flex-wrap">
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

const SetAttributeForm = observer(
  (props: {
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
        <form className="ml-4 md:ml-0">
          <AttrField
            description={description}
            attr={attr}
            form={form}
            baseEntityId={props.baseEntityId}
          />
        </form>
      </Form>
    ) : null;
  },
);

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
                <TextField {...props} field={field} attr={attr} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {name === "date" ||
      name === "flag" ||
      name === "timestamp" ||
      name === "enumeration" ? (
        <FormField
          control={props.form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="border-l border-foreground pl-4 flex flex-col gap-2">
              <FormLabel>{formLabel}</FormLabel>
              <FormControl>
                <NonTextField {...props} field={field} attr={attr} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </>
  );
});

const dayjsIsDifferent = (d1?: Dayjs, d2?: Dayjs) => {
  if (d1 === undefined && d2 === undefined) return false;
  if (d1 === undefined || d2 === undefined) return true;

  return !d1.isSame(d2);
};

const isDifferent = (
  description: WorkflowAttributeDescription,
  v1: Dayjs | string | boolean | undefined,
  v2: Dayjs | string | boolean | undefined,
) => {
  switch (description.attrType) {
    case "DATE":
    case "TIMESTAMP": {
      const v1Typed = v1 as Dayjs | undefined;
      const v2Typed = v2 as Dayjs | undefined;

      return dayjsIsDifferent(v1Typed, v2Typed);
    }
    case "FLAG":
    case "ENUMERATION": {
      return v1 !== v2;
    }
  }

  return true;
};

const NonTextField = ({
  field,
  form,
  description,
  baseEntityId,
  attr,
}: CommonAttributeFormFieldProps & {
  field: ControllerRenderProps<
    SetAttributeFormType,
    "date" | "timestamp" | "flag" | "enumeration"
  >;
}) => {
  const value = form.watch("date");
  const workflowStore = useWorkflowStore();

  React.useEffect(() => {
    if (isDifferent(description, attr?.date, value)) {
      void form.handleSubmit((attr) => {
        return workflowStore.setAttribute({
          refType: description.refType,
          baseEntityId,
          attributeName: description.name,
          attr: attr as any,
        });
      })();
    }
  }, [value]);

  return description.attrType === "DATE" ? (
    <DatePicker
      classNames={{ inputBox: "w-[19rem]" }}
      date={field.value as Dayjs | undefined}
      {...field}
    />
  ) : description.attrType === "TIMESTAMP" ? (
    <DateTimePicker
      classNames={{ inputBox: "w-[19rem]" }}
      {...field}
      value={field.value as Dayjs | undefined}
    />
  ) : description.attrType === "FLAG" ? (
    <div className="flex justify-start gap-4 align-bottom w-[19rem]">
      <span
        className={cn("transition-all duration-150", {
          "opacity-50": value,
        })}
      >
        false
      </span>
      <Switch
        checked={field.value as boolean | undefined}
        onCheckedChange={field.onChange}
      />
      <span
        className={cn("transition-all duration-150", {
          "opacity-50": !value,
        })}
      >
        true
      </span>
    </div>
  ) : description.attrType === "ENUMERATION" ? (
    <Select
      value={field.value as string | undefined}
      onValueChange={field.onChange}
    >
      <SelectTrigger className="w-[19rem]">
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
  ) : null;
};

const textInputToFieldValue = (
  attrType: WorkflowAttributeType,
  value?: string,
) => {
  let ret:
    | { value?: Decimal | bigint | number | string; error?: boolean }
    | undefined;
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

  return ret ?? { error: true };
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
