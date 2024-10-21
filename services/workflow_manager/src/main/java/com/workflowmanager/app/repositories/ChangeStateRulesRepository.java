package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowState;
import com.workflowmanager.app.domains.state.ChangeStateRules;

import java.util.Optional;
import org.springframework.data.repository.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Qualifier;

@Qualifier("workflow_states")
public interface ChangeStateRulesRepository extends Repository<ChangeStateRules, Integer> {
    /**
     * Upsert change state rules
	 */
    void save(ChangeStateRules changeStateRules);
}
