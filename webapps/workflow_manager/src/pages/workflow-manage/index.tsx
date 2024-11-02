import { useParams } from "react-router-dom";

const WorkflowManagePage = () => {
  const { workflowId } = useParams();

  return <p>{workflowId}</p>;
};

export default WorkflowManagePage;
