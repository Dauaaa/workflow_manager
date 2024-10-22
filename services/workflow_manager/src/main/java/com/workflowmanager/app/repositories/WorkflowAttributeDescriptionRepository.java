package com.workflowmanager.app.repositories;

import com.workflowmanager.app.domains.WorkflowAttributeDescription;

import java.util.Optional;
import org.springframework.data.repository.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Qualifier;

public interface WorkflowAttributeDescriptionRepository extends Repository<WorkflowAttributeDescription, Integer> {
    /**
     * Upsert attribute description
	 */
    void save(WorkflowAttributeDescription workflow);
}
