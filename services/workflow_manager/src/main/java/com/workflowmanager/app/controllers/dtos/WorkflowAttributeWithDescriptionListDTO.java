package com.workflowmanager.app.controllers.dtos;

import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class WorkflowAttributeWithDescriptionListDTO {
  public List<WorkflowAttributeResponseDTO> items;

  public WorkflowAttributeWithDescriptionListDTO(
      List<WorkflowAttribute> attributes, List<WorkflowAttributeDescription> descriptions) {

    Map<String, WorkflowAttributeResponseDTO> descriptionMap =
        descriptions.stream()
            .collect(
                Collectors.toMap(
                    WorkflowAttributeDescription::getName,
                    desc -> new WorkflowAttributeResponseDTO(null, desc)));

    attributes.stream()
        .forEach(
            attr -> {
              WorkflowAttributeResponseDTO cur = descriptionMap.get(attr.getDescriptionName());

              // SAFETY: cur shouldn't be null because of db constraint
              cur.attribute = attr;
            });

    this.items = descriptionMap.values().stream().collect(Collectors.toList());
  }
}
