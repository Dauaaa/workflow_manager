package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface WorkflowAttributeRepository extends Repository<WorkflowAttribute, Integer> {
  /** Upsert attribute description */
  void save(WorkflowAttribute workflow);

  @Query(
      "SELECT wa FROM WorkflowAttribute wa WHERE wa.id.baseEntityId ="
          + " :baseEntityId AND wa.id.description.refType = :refType")
  List<WorkflowAttribute> list(
      @Param("baseEntityId") Integer baseEntityId,
      @Param("refType") WorkflowAttributeReferenceType refType);

  @Query(
      "SELECT wa FROM WorkflowAttribute wa WHERE wa.id.baseEntityId = :baseEntityId AND"
          + " wa.id.description.name = :descriptionName AND wa.id.description.refType = :refType")
  Optional<WorkflowAttribute> getByBaseEntityAndDescriptionName(
      @Param("baseEntityId") Integer baseEntityId,
      @Param("descriptionName") String descriptionName,
      @Param("refType") WorkflowAttributeReferenceType refType);
}
