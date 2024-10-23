package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowEntity;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface WorkflowEntityRepository extends Repository<WorkflowEntity, Integer> {
  /** Upsert workflow entity */
  void save(WorkflowEntity workflowEntity);

  /** Get workflow entity by id */
  @Query("SELECT we FROM WorkflowEntity we WHERE we.id = :id AND we.clientId = :clientId")
  @Transactional(readOnly = true)
  Optional<WorkflowEntity> getByIdAndClientId(
      @Param("id") Integer id, @Param("clientId") Integer clientId);

  /** Get workflow state by id */
  @Query(
      "SELECT we FROM WorkflowEntity we WHERE we.workflow.id = :workflowId AND we.clientId ="
          + " :clientId")
  @Transactional(readOnly = true)
  Page<WorkflowEntity> listByWorkflowIdAndClientId(
      @Param("workflowId") Integer workflowId,
      @Param("clientId") Integer clientId,
      Pageable pageable);

  /** Get workflow state by id */
  @Query(
      "SELECT we FROM WorkflowEntity we WHERE we.currentState.id = :stateId AND we.clientId ="
          + " :clientId")
  @Transactional(readOnly = true)
  Page<WorkflowEntity> listByStateIdAndClientId(
      @Param("stateId") Integer stateId, @Param("clientId") Integer clientId, Pageable pageable);
}
