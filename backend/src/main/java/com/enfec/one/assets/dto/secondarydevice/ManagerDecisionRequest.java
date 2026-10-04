package com.enfec.one.assets.dto.secondarydevice;

import jakarta.validation.constraints.Size;

public class ManagerDecisionRequest {

    @Size(
            max = 500,
            message = "Manager comment must not exceed 500 characters"
    )
    private String comment;

    public ManagerDecisionRequest() {
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}