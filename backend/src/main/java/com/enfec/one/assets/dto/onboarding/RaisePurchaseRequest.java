package com.enfec.one.assets.dto.onboarding;

import java.math.BigDecimal;

public class RaisePurchaseRequest {

    private BigDecimal estimatedCost;

    public RaisePurchaseRequest() {
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(
            BigDecimal estimatedCost
    ) {
        this.estimatedCost = estimatedCost;
    }
}