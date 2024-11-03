package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowEntity;
import java.util.List;
import java.util.Optional;
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

  @Query(
      "SELECT we FROM WorkflowEntity we WHERE we.currentState.id = :stateId AND we.clientId ="
          + " :clientId")
  @Transactional(readOnly = true)
  List<WorkflowEntity> listByStateAndClient(
      @Param("stateId") Integer stateId, @Param("clientId") Integer clientId);

  @Query(
      "SELECT we FROM WorkflowEntity we WHERE we.workflow.id = :workflowId AND we.clientId ="
          + " :clientId")
  @Transactional(readOnly = true)
  List<WorkflowEntity> listByWorkflowAndClient(
      @Param("workflowId") Integer workflowId, @Param("clientId") Integer clientId);
}
