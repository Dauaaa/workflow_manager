package com.workflowmanager.app.domains.attribute;

import jakarta.persistence.Embeddable;
import java.util.Objects;

@Embeddable
public class WorkflowAttributeRegexRule extends WorkflowAttributeRule {
  public WorkflowAttributeRegexRule() {}

  @Override
  public int hashCode() {
    return Objects.hash(this.description, this.rule, this.errorText);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || this.getClass() != o.getClass()) return false;
    WorkflowAttributeRule that = (WorkflowAttributeRule) o;
    return Objects.equals(this.description, that.description)
        && Objects.equals(this.rule, that.rule)
        && Objects.equals(this.errorText, that.errorText);
  }
}
