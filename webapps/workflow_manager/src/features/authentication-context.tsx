import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useWorkflowStore } from "@/store/context";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateIcon } from "@radix-ui/react-icons";
import { observer } from "mobx-react-lite";
import { useForm } from "react-hook-form";
import { z } from "zod";
import "react";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { v4 } from "uuid";

const AuthenticationSchema = z.object({
  clientId: z.string().uuid({
    message: "Client id is of type uuid",
  }),
});
type AuthenticationType = z.infer<typeof AuthenticationSchema>;

export const AuthenticationContext = observer(() => {
  const workflowStore = useWorkflowStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const form = useForm<AuthenticationType>({
    resolver: zodResolver(AuthenticationSchema),
    defaultValues: {
      clientId: "",
    },
  });

  // sync clientId search param with authentication
  useEffect(() => {
    const clientId = searchParams.get("clientId");
    if (!clientId) return;
    workflowStore.setAuthentication({
      clientId,
    });
    setSearchParams((searchParams) => {
      const paramsAsObject = Object.fromEntries(searchParams.entries());
      delete paramsAsObject["clientId"];
      return new URLSearchParams(paramsAsObject);
    });
  }, [searchParams]);

  const auth = workflowStore.authentication.current;

  return (
    <Dialog open={!auth}>
      <DialogContent className="max-w-[80vw]" hideCloseIcon>
        <DialogHeader className="max-w-[60vw]">
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Create a new client or provide an existing Client ID.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((val) => {
              workflowStore.setAuthentication({
                clientId: val.clientId,
              });
              form.reset();
            })}
            className="max-w-[80vw] flex flex-col gap-8"
          >
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <div className="flex gap-4 font-mono">
                    <FormControl className="flex">
                      <Input {...field} className="w-full" />
                    </FormControl>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        field.onChange(v4());
                      }}
                    >
                      <UpdateIcon />
                    </Button>
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit">Login</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
