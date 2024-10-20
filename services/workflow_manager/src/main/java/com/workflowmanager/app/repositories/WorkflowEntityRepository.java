package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.Workflow;
import com.workflowmanager.app.domains.WorkflowEntity;

import java.util.Optional;
import org.springframework.data.repository.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Qualifier;

@Qualifier("workflow_states")
public interface WorkflowEntityRepository extends Repository<WorkflowEntity, Integer> {
    /**
     * Upsert workflow state
	 */
    void save(WorkflowEntity workflowEntity);

    /**
     * List workflow state by id
     */
    @Query("SELECT we FROM WorkflowEntity we WHERE we.id = :id AND we.clientId = :clientId")
    @Transactional(readOnly = true)
    Optional<WorkflowEntity> getByIdAndClientId(@Param("id") Integer id, @Param("clientId") Integer clientId);
}

