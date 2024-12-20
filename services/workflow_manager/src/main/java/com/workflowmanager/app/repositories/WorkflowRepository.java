package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.Workflow;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

@Qualifier("workflows")
public interface WorkflowRepository extends Repository<Workflow, Integer> {
  /** Upsert workflow */
  void save(Workflow workflow);

  /** Upsert workflow */
  @Query("SELECT w FROM Workflow w WHERE w.clientId = :clientId")
  @Transactional(readOnly = true)
  List<Workflow> list(@Param("clientId") UUID clientId);

  /** Get workflow by id and client_id */
  @Query(
      "SELECT w FROM Workflow w LEFT JOIN w.initialState WHERE w.id = :id AND w.clientId ="
          + " :clientId")
  @Transactional(readOnly = true)
  Optional<Workflow> getByIdAndClientId(@Param("id") Integer id, @Param("clientId") UUID clientId);
}
