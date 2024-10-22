package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowState;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

@Qualifier("workflow_states")
public interface WorkflowStateRepository extends Repository<WorkflowState, Integer> {
  /** Upsert workflow state */
  void save(WorkflowState workflowState);

  /** Get workflow state by id */
  @Query(
      "SELECT new com.workflowmanager.app.domains.WorkflowState(ws, (SELECT COUNT(we) FROM"
          + " WorkflowEntity we WHERE we.currentState.id = :id)) FROM WorkflowState ws WHERE ws.id"
          + " = :id AND ws.clientId = :clientId")
  @Transactional(readOnly = true)
  Optional<WorkflowState> getByIdAndClientId(
      @Param("id") Integer id, @Param("clientId") Integer clientId);

  /** List workflow state by id */
  @Query(
      "SELECT ws FROM WorkflowState ws LEFT OUTER JOIN ws.workflow WHERE ws.id = :id AND"
          + " ws.clientId = :clientId")
  @Transactional(readOnly = true)
  Optional<WorkflowState> getByIdAndClientIdWithWorkflow(
      @Param("id") Integer id, @Param("clientId") Integer clientId);
}
