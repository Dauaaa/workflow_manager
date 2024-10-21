package com.workflowmanager.app.domains.workflow;

import com.workflowmanager.app.domains.WorkflowState;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Class with all public fields. Used to set some values in a Workflow.
 */
public class WorkflowConfig {
    public WorkflowState initialState;

    /**
     * Most configuration options don't need to be resolved, this object
     * keeps the DTO so it's easier to access the simpler config values.
     */
    public WorkflowConfigDTO rawConfig;

    public WorkflowConfig(WorkflowConfigDTO config, WorkflowState initialState) {
        this.initialState = initialState;
        this.rawConfig = config;
    }
}
