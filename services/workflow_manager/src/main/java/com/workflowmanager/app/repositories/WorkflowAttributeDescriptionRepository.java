package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface WorkflowAttributeDescriptionRepository
    extends Repository<WorkflowAttributeDescription, Integer> {
  /** Upsert attribute description */
  void save(WorkflowAttributeDescription workflow);

  @Query(
      "SELECT wad FROM WorkflowAttributeDescription wad WHERE wad.name = :name AND"
          + " wad.parentWorkflow.id = :workflowId")
  Optional<WorkflowAttributeDescription> getByNameParentWorkflowId(
      @Param("name") String name, @Param("workflowId") Integer parentWorkflowId);
}
