package com.workflowmanager.app.domains;

import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeReferenceType;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeType;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "workflow_attributes")
public class WorkflowAttribute {
  @EmbeddedId private WorkflowAttributeId id;
  private Instant creationTime;
  private Instant updateTime;

  public String getDescriptionName() {
    if (this.id.getDescription() == null) return null;
    return this.id.getDescription().getName();
  }

  public Integer getParentWorkflowId() {
    if (this.id.getDescription() == null) return null;
    return this.id.getDescription().getParentWorkflowId();
  }

  public Integer getBaseEntityId() {
    return this.id.getBaseEntityId();
  }

  public Instant getCreationTime() {
    return this.creationTime;
  }

  public Instant getUpdateTime() {
    return this.updateTime;
  }

  // values
  private Long integer;
  private Double floating;
  private String enumeration;
  private BigDecimal decimal;
  private Date date;
  private Instant timestamp;
  private Boolean flag;
  private String text;

  public WorkflowAttribute() {}

  public WorkflowAttribute(
      NewWorkflowAttributeDTO attributeDTO,
      WorkflowAttributeDescription description,
      Workflow parentWorkflow,
      Integer baseEntityId,
      WorkflowAttributeReferenceType refType) {
    this.id = new WorkflowAttributeId(description, parentWorkflow, baseEntityId, refType);
    this.update(attributeDTO);
  }

  public void update(NewWorkflowAttributeDTO attributeDTO) {
    this.setInteger(attributeDTO.integer);
    this.setFloating(attributeDTO.floating);
    this.setEnumeration(attributeDTO.enumeration);
    this.setDecimal(attributeDTO.decimal);
    this.setDate(attributeDTO.date);
    this.setTimestamp(attributeDTO.timestamp);
    this.setFlag(attributeDTO.flag);
    this.setText(attributeDTO.text);
  }

  public Long getInteger() {
    return this.integer;
  }

  public Double getFloating() {
    return this.floating;
  }

  public String getEnumeration() {
    return this.enumeration;
  }

  public BigDecimal getDecimal() {
    return this.decimal;
  }

  public Date getDate() {
    return this.date;
  }

  public Instant getTimestamp() {
    return this.timestamp;
  }

  public Boolean getFlag() {
    return this.flag;
  }

  public String getText() {
    return this.text;
  }

  public void setInteger(Long integer) throws ResponseStatusException {
    if (integer == null) {
      this.integer = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.INTEGER, this.id.getDescription().getAttrType());

    this.integer = integer;
  }

  public void setFloating(Double floating) throws ResponseStatusException {
    if (floating == null) {
      this.floating = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.FLOATING, this.id.getDescription().getAttrType());

    this.floating = floating;
  }

  public void setEnumeration(String enumeration) throws ResponseStatusException {
    if (enumeration == null) {
      this.enumeration = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.ENUMERATION, this.id.getDescription().getAttrType());

    this.enumeration = enumeration;
  }

  public void setDecimal(BigDecimal decimal) throws ResponseStatusException {
    if (decimal == null) {
      this.decimal = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.DECIMAL, this.id.getDescription().getAttrType());

    this.decimal = decimal;
  }

  public void setDate(Date date) throws ResponseStatusException {
    if (date == null) {
      this.date = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.DATE, this.id.getDescription().getAttrType());

    this.date = date;
  }

  public void setTimestamp(Instant timestamp) throws ResponseStatusException {
    if (timestamp == null) {
      this.timestamp = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.TIMESTAMP, this.id.getDescription().getAttrType());

    this.timestamp = timestamp;
  }

  public void setFlag(Boolean flag) throws ResponseStatusException {
    if (flag == null) {
      this.flag = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.FLAG, this.id.getDescription().getAttrType());

    this.flag = flag;
  }

  public void setText(String text) throws ResponseStatusException {
    if (text == null) {
      this.text = null;
      return;
    }

    ErrorUtils.assertEq(WorkflowAttributeType.TEXT, this.id.getDescription().getAttrType());

    this.text = text;
  }

  public Object getValue(WorkflowAttributeType ty) {
    switch (ty) {
      case ENUMERATION:
        return this.getEnumeration();
      case TEXT:
        return this.getText();
      case DATE:
        return this.getDate();
      case FLOATING:
        return this.getFloating();
      case FLAG:
        return this.getFlag();
      case DECIMAL:
        return this.getDecimal();
      case INTEGER:
        return this.getInteger();
      case TIMESTAMP:
        return this.getTimestamp();
    }

    return null;
  }

  @PrePersist
  protected void onPersist() {
    this.creationTime = Instant.now();
    this.updateTime = Instant.now();
  }

  @PreUpdate
  protected void onUpdate() {
    this.updateTime = Instant.now();
  }
}
