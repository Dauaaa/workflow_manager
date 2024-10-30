package com.workflowmanager.app.core;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.web.server.ResponseStatusException;

@Schema(
    description =
        "Base class for all entities in the project. Examples: Workflow, WorkflowState,"
            + " WorkflowEntity")
@MappedSuperclass
public abstract class BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(description = "Numeric id of the entity. Generated on creation.")
  private Integer id;

  @Schema(description = "Name of the entity, max of 50 characters.")
  @Size(min = 2, max = 50)
  @NotNull
  private String name;

  @Schema(description = "Id of the user that created the entity.")
  @Column(name = "user_id", nullable = false, updatable = false)
  @NotNull
  private Integer userId;

  @Schema(description = "Id of the client that owns the entity.")
  @Column(name = "client_id", nullable = false, updatable = false)
  @NotNull
  private Integer clientId;

  @Column(name = "creation_time", nullable = false, updatable = false)
  @NotNull
  private Instant creationTime;

  @Column(name = "update_time", nullable = false)
  @NotNull
  private Instant updateTime;

  @Column(name = "deletion_time")
  private Instant deletionTime;

  public BaseEntity() {}

  public BaseEntity(BaseEntity that) throws ResponseStatusException {
    ErrorUtils.serverAssertNeq(that, null);

    this.name = that.getName();
    this.id = that.getId();
    this.clientId = that.getClientId();
    this.userId = that.getUserId();
    this.creationTime = that.getCreationTime();
    this.updateTime = that.getUpdateTime();
    this.deletionTime = that.getDeletionTime();
  }

  public BaseEntity(NewBaseEntityDTO newBaseEntity) {
    this.name = newBaseEntity.name;
    this.clientId = newBaseEntity.clientId;
    this.userId = newBaseEntity.userId;
  }

  public Integer getId() {
    return this.id;
  }

  public String getName() {
    return this.name;
  }

  public Integer getUserId() {
    return this.userId;
  }

  public Integer getClientId() {
    return this.clientId;
  }

  public Instant getCreationTime() {
    return this.creationTime;
  }

  public Instant getUpdateTime() {
    return this.updateTime;
  }

  public Instant getDeletionTime() {
    return this.deletionTime;
  }

  @PrePersist
  protected void onCreate() {
    this.creationTime = Instant.now();
    this.updateTime = Instant.now();
  }

  @PreUpdate
  protected void onUpdate() {
    this.updateTime = Instant.now();
  }
}
