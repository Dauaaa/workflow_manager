package com.workflowmanager.app.domains.state;

import java.io.Serializable;
import java.util.Objects;

public class ChangeStateRulesId implements Serializable {
    private Integer from;
    private Integer to;

    // Getters and setters, equals and hashCode
    public Integer getFrom() {
        return from;
    }

    public void setFrom(Integer from) {
        this.from = from;
    }

    public Integer getTo() {
        return to;
    }

    public void setTo(Integer to) {
        this.to = to;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || this.getClass() != o.getClass()) return false;
        ChangeStateRulesId that = (ChangeStateRulesId) o;
        return Objects.equals(this.from, that.from) && Objects.equals(this.to, that.to);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.from, this.to);
    }
}
