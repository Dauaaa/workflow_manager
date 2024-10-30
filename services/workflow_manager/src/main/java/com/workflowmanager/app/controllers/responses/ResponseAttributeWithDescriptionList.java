package com.workflowmanager.app.controllers.responses;

import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.lang.NonNull;

public class ResponseAttributeWithDescriptionList {
  public List<ResponseAttributeWithDescription> items;

  public ResponseAttributeWithDescriptionList(
      List<WorkflowAttribute> attributes, List<WorkflowAttributeDescription> descriptions) {

    Map<String, ResponseAttributeWithDescription> descriptionMap =
        descriptions.stream()
            .collect(
                Collectors.toMap(
                    WorkflowAttributeDescription::getName,
                    desc -> new ResponseAttributeWithDescription(desc)));

    attributes.stream()
        .forEach(
            attr -> {
              ResponseAttributeWithDescription cur = descriptionMap.get(attr.getDescriptionName());

              // SAFETY: cur shouldn't be null because of db constraint
              cur.attr = new ResponseAttribute(attr);
            });

    this.items = descriptionMap.values().stream().collect(Collectors.toList());
  }

  public class ResponseAttributeWithDescription {
    public ResponseAttribute attr;
    @NonNull public ResponseAttributeDescription description;

    public ResponseAttributeWithDescription(WorkflowAttributeDescription description) {
      this.description = new ResponseAttributeDescription(description);
    }
  }
}
