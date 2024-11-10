import { NewWorkflowForm } from "@/features/new-workflow-form";
import { useWorkflowStore } from "@/store/context";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@radix-ui/react-popover";
import { Link } from "react-router-dom";

const WorkflowsPage = () => {
  const workflowStore = useWorkflowStore();

  useEffect(() => {
    void workflowStore.loadWorkflows();
  }, [workflowStore]);

  return (
    <div className="min-h-[100vh] pt-64">
      <div className="mx-auto w-3/5">
        <h1 className="text-accent-foreground font-bold font-serif text-xl mb-4 ml-2">
          Workflows
        </h1>
        <WorkflowList />
      </div>
    </div>
  );
};

const WorkflowList = observer(() => {
  const workflowStore = useWorkflowStore();

  const workflows = [...workflowStore.workflows.values()].sort(
    (a, b) => b.id - a.id,
  );

  return (
    <div className="flex flex-wrap w-full gap-4">
      {workflows.map((workflow) => (
        <Link to={workflow.id.toString()} key={workflow.id}>
          <Card className="w-48 h-48 text-accent-foreground rounded-3xl flex flex-col justify-between hover:bg-accent">
            <CardTitle className="pl-4 pt-4 font-semibold text-xl font-mono line-clamp-2">
              {workflow.name}
            </CardTitle>
            <CardFooter className="text-muted-foreground text-xs">
              Created {workflow.creationTime.fromNow()}
            </CardFooter>
          </Card>
        </Link>
      ))}
      <NewWorkflowButton />
    </div>
  );
});

const NewWorkflowButton = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="w-48 h-48 rounded-3xl flex flex-col justify-center cursor-pointer hover:bg-accent transition-all duration-150">
          <PlusIcon className="h-20 w-20 m-auto" />
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <Card className="flex flex-col gap-4">
          <CardTitle className="m-4">Create new workflow</CardTitle>
          <CardContent>
            <NewWorkflowForm
              buttonOverride={
                <PopoverClose asChild>
                  <Button type="submit">Create</Button>
                </PopoverClose>
              }
            />
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default WorkflowsPage;
