package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowAttribute;
import org.springframework.data.repository.Repository;

public interface WorkflowAttributeRepository extends Repository<WorkflowAttribute, Integer> {
  /** Upsert attribute description */
  void save(WorkflowAttribute workflow);
}
