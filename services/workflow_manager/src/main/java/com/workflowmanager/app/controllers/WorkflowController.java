package com.workflowmanager.app.controllers;

import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.NewWorkflowDTO;
import com.workflowmanager.app.repositories.WorkflowRepository;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import java.io.Serializable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;

@Controller
public class WorkflowController implements Serializable {
    private final WorkflowRepository workflowRepository;

    public WorkflowController(WorkflowRepository workflowRepository) {
        this.workflowRepository = workflowRepository;
	}

    @GetMapping("workflows/{workflowId}")
    @ResponseBody
    public Workflow getWorkflow(@PathVariable("workflowId") Integer workflowId) {
        return this.workflowRepository.getByIdAndClientId(workflowId, 1).orElseThrow(() -> ErrorUtils.notFoundById(Workflow.class, workflowId));
    }

    @PostMapping("workflows")
    @ResponseBody
    public Workflow createWorkflow(@RequestBody NewWorkflowDTO newWorkflow) {
        AuthorizationDTO auth = new AuthorizationDTO(1, 1);

        Workflow workflow = new Workflow(newWorkflow, auth);
        this.workflowRepository.save(workflow);

        return this.workflowRepository.getByIdAndClientId(workflow.getId(), workflow.getClientId()).orElseThrow();
    }
}
