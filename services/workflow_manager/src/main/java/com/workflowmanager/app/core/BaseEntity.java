package com.workflowmanager.app.core;

import java.time.Instant;
import java.lang.reflect.Method;

import org.springframework.aop.support.StaticMethodMatcherPointcut;
import org.springframework.aop.AfterReturningAdvice;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.PrePersist;
import org.springframework.beans.factory.annotation.Autowired;

import com.workflowmanager.app.core.AuthorizationDTO;

@MappedSuperclass
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    @Column(name = "user_id", nullable = false)
    private Integer userId;
    @Column(name = "client_id", nullable = false)
    private Integer clientId;
    @Column(name = "creation_time", nullable = false, updatable = false)
    private Instant creationTime;
    @Column(name = "update_time", nullable = false)
    private Instant updateTime;
    @Column(name = "deletion_time")
    private Instant deletionTime;

    @Autowired
    public BaseEntity() {}

    public BaseEntity(NewBaseEntityDTO newBaseEntity, AuthorizationDTO auth) {
        this.name = newBaseEntity.name;
        this.clientId = auth.clientId;
        this.userId = auth.userId;
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

class BaseEntityUpdatePointcut extends StaticMethodMatcherPointcut {
    public boolean matches(Method method, Class targetClass) {
        return isBaseEntitySubclass(targetClass) && isSetter(method);
	}

    private boolean isBaseEntitySubclass(Class targetClass) {
        return BaseEntity.class.isAssignableFrom(targetClass);
    }

    private boolean isSetter(Method method) {
        return method.getName().startsWith("set");
    }
}

class BaseEntityUpdateAfterReturningAdvice implements AfterReturningAdvice {
    public void afterReturning(Object returnValue, Method m, Object[] args, Object target)
			throws Throwable {
	    System.out.println("Invocation returned");
    }
}
