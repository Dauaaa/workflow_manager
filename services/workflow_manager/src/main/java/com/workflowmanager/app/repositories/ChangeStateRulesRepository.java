package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.state.ChangeStateRules;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

@Qualifier("workflow_states")
public interface ChangeStateRulesRepository extends Repository<ChangeStateRules, Integer> {
  /** Upsert change state rules */
  void save(ChangeStateRules changeStateRules);

  @Query("SELECT r FROM ChangeStateRules r WHERE r.from.id = :fromId AND r.to.id = :toId")
  Optional<ChangeStateRules> get(@Param("fromId") Integer formId, @Param("toId") Integer toId);
}
