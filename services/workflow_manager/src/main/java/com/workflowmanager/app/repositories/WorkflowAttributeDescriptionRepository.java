package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import org.springframework.data.repository.Repository;

public interface WorkflowAttributeDescriptionRepository
    extends Repository<WorkflowAttributeDescription, Integer> {
  /** Upsert attribute description */
  void save(WorkflowAttributeDescription workflow);
}
