import { NewWorkflowForm } from "./new-workflow-form";
import { useWorkflowStore } from "@/store/context";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { WorkflowStore } from "@/store/workflow-store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const requestHash = WorkflowStore.requestHash<"loadWorkflows">(undefined);

const WorkflowsPage = observer(() => {
  const workflowStore = useWorkflowStore();

  if (workflowStore.authentication.current?.clientId)
    void workflowStore.loadWorkflows();

  return (
    <div className="min-h-[100vh] pt-64 pb-24">
      <div className="mx-auto w-5/6 sm:w-3/5">
        <h1
          className="
        text-4xl text-center
        md:text-xl md:text-left md:ml-2
        text-accent-foreground font-bold font-serif mb-4
        "
        >
          Workflows
        </h1>
        <WorkflowList />
      </div>
    </div>
  );
});

const cardClassName = cn(`
w-96 h-32 mx-auto max-w-[80vw]
md:w-48 md:h-48 md:mx-0
text-accent-foreground rounded-3xl flex flex-col justify-between hover:bg-accent
`);

const cardTitleClassName = cn(`
text-2xl line-clamp-1
md:text-xl md:line-clamp-2
px-4 pt-4 font-semibold font-mono
`);

const cardFooterClassName = cn(`
text-lg
md:text-xs
text-muted-foreground
`);

const WorkflowList = observer(() => {
  const workflowStore = useWorkflowStore();

  const workflows = [...workflowStore.workflows.values()].sort(
    (a, b) => b.id - a.id,
  );

  const status = workflowStore.requestStatus.loadWorkflows.get(requestHash);

  return (
    <div className="flex flex-col md:flex-row flex-wrap w-full gap-4">
      {workflows.map((workflow) => (
        <Link to={workflow.id.toString()} key={workflow.id}>
          <Card className={cardClassName}>
            <CardTitle className={cardTitleClassName}>
              {workflow.name}
            </CardTitle>
            <CardFooter className={cardFooterClassName}>
              Created {workflow.creationTime.fromNow()}
            </CardFooter>
          </Card>
        </Link>
      ))}
      {status === "LOADING" || !status ? (
        <LoadingCard />
      ) : status === "ERROR" ? (
        <ErrorCard />
      ) : status === "OK" ? (
        <NewWorkflowButton />
      ) : null}
    </div>
  );
});

const LoadingCard = () => (
  <div className={cardClassName}>
    <Skeleton className="h-full w-full" />
  </div>
);

const ErrorCard = () => {
  const [toastType, setToastType] = useState(0);

  const toastMessager = () => {
    if (toastType % 2 === 0)
      toast("Oh no! An error occured :(", {
        style: {
          background: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
        },
      });
    else
      toast("Every success leaves a track of errors...", {
        style: {
          background: "hsl(var(--success))",
          color: "hsl(var(--success-foreground))",
        },
      });

    setToastType((t) => ++t);
  };

  return (
    <div
      onClick={toastMessager}
      className={cn(cardClassName, "bg-destructive hover:bg-destructive/90")}
    >
      <span className="text-xl my-auto font-extrabold text-destructive-foreground text-center">
        ERROR
      </span>
    </div>
  );
};

const NewWorkflowButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            "gradient-background flex flex-col justify-center cursor-pointer hover:border-2 hover:border-accent",
            cardClassName,
          )}
        >
          <PlusIcon className="h-20 w-20 m-auto" />
        </div>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-4 border-0">
        <DialogTitle className="m-4">Create new workflow</DialogTitle>
        <DialogDescription>
          Input data for new workflow. Press enter to submit.
        </DialogDescription>
        <NewWorkflowForm
          onSubmitFinish={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          buttonOverride={
            <DialogClose asChild>
              <Button type="submit">Create</Button>
            </DialogClose>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowsPage;
