package com.workflowmanager.app.controllers;

import com.workflowmanager.app.core.AuthorizationDTO;
import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowEntity;
import com.workflowmanager.app.domains.NewWorkflowEntityDTO;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.repositories.WorkflowEntityRepository;
import com.workflowmanager.app.repositories.WorkflowRepository;
import com.workflowmanager.app.repositories.WorkflowStateRepository;
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
public class WorkflowEntityController implements Serializable {
    private final WorkflowEntityRepository workflowEntityRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowStateRepository workflowStateRepository;

    public WorkflowEntityController(WorkflowEntityRepository workflowEntityRepository, WorkflowRepository workflowRepository, WorkflowStateRepository workflowStateRepository) {
        this.workflowEntityRepository = workflowEntityRepository;
        this.workflowRepository = workflowRepository;
        this.workflowStateRepository = workflowStateRepository;
	}

    @GetMapping("workflow-entities/{workflowEntityId}")
    @ResponseBody
    public WorkflowEntity getWorkflow(@PathVariable("workflowEntityId") Integer workflowEntityId) {
        return this.workflowEntityRepository.getByIdAndClientId(workflowEntityId, 1).orElseThrow(() -> ErrorUtils.notFoundById(WorkflowEntity.class, workflowEntityId));
    }

    @PostMapping("workflows/{workflowId}/workflow-entities")
    @ResponseBody
    public WorkflowEntity createWorkflow(@PathVariable("workflowId") Integer workflowId, @RequestBody NewWorkflowEntityDTO newWorkflow) {
        AuthorizationDTO auth = new AuthorizationDTO(1, 1);

        Workflow workflow = this.workflowRepository.getByIdAndClientId(workflowId, 1).orElseThrow(() -> ErrorUtils.notFoundById(Workflow.class, workflowId));

        WorkflowEntity workflowEntity = new WorkflowEntity(newWorkflow, auth, workflow);
        this.workflowEntityRepository.save(workflowEntity);

        return this.workflowEntityRepository.getByIdAndClientId(workflowEntity.getId(), workflowEntity.getClientId()).orElseThrow();
    }
}
