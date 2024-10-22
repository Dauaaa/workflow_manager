package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowEntity;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

@Qualifier("workflow_states")
public interface WorkflowEntityRepository extends Repository<WorkflowEntity, Integer> {
  /** Upsert workflow state */
  void save(WorkflowEntity workflowEntity);

  /** Get workflow state by id */
  @Query("SELECT we FROM WorkflowEntity we WHERE we.id = :id AND we.clientId = :clientId")
  @Transactional(readOnly = true)
  Optional<WorkflowEntity> getByIdAndClientId(
      @Param("id") Integer id, @Param("clientId") Integer clientId);
}
