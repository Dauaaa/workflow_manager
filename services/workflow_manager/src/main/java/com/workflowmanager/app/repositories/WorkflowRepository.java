package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.Workflow;

import java.util.Optional;
import org.springframework.data.repository.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Qualifier;

@Qualifier("workflows")
public interface WorkflowRepository extends Repository<Workflow, Integer> {
    /**
     * Upsert workflow
	 */
    void save(Workflow workflow);

    /**
     * List workflow by id and client_id
     */
    @Query("SELECT w FROM Workflow w LEFT JOIN w.initialState WHERE w.id = :id AND w.clientId = :clientId")
    @Transactional(readOnly = true)
    Optional<Workflow> getByIdAndClientId(@Param("id") Integer id, @Param("clientId") Integer clientId);
}
