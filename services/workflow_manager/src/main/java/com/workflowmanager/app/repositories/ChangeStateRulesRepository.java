package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.state.ChangeStateRules;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.repository.Repository;

@Qualifier("workflow_states")
public interface ChangeStateRulesRepository extends Repository<ChangeStateRules, Integer> {
  /** Upsert change state rules */
  void save(ChangeStateRules changeStateRules);
}
