package com.workflowmanager.app.controllers;

import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.NewWorkflowStateDTO;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
import com.workflowmanager.app.repositories.WorkflowRepository;
import java.util.Optional;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

@Controller
@RequestMapping("/workflows/{workflowId}")
public class WorkflowStateController implements Serializable {
    private final WorkflowStateRepository workflowStateRepository;
    private final WorkflowRepository workflowRepository;

    public WorkflowStateController(WorkflowStateRepository workflowStateRepository, WorkflowRepository workflowRepository) {
        this.workflowStateRepository = workflowStateRepository;
        this.workflowRepository = workflowRepository;
	}

    @GetMapping("workflow-states/{workflowStateId}")
    @ResponseBody
    public WorkflowState getWorkflow(@PathVariable("workflowStateId") Integer workflowStateId) {
        return this.workflowStateRepository.getByIdAndClientId(workflowStateId, 1).orElseThrow(() -> ErrorUtils.notFoundById(WorkflowState.class, workflowStateId));
    }

    @PostMapping("workflow-states")
    @ResponseBody
    public WorkflowState createWorkflow(@PathVariable("workflowId") Integer workflowId, @RequestBody NewWorkflowStateDTO newWorkflowState) {
        AuthorizationDTO auth = new AuthorizationDTO(1, 1);
        Workflow workflow = this.workflowRepository.getByIdAndClientId(workflowId, 1).orElseThrow(() -> ErrorUtils.notFoundById(Workflow.class, workflowId));

        WorkflowState workflowState = new WorkflowState(newWorkflowState, auth, workflow);
        this.workflowStateRepository.save(workflowState);

        return this.workflowStateRepository.getByIdAndClientId(workflowState.getId(), workflowState.getClientId()).orElseThrow();
    }
}
