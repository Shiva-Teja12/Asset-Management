package com.enfec.one.assets.dto.onboarding;

public class StockCheckRequest {

    private boolean stockAvailable;

    private String comment;


    public StockCheckRequest() {
    }


    public boolean isStockAvailable() {
        return stockAvailable;
    }


    public void setStockAvailable(
            boolean stockAvailable
    ) {
        this.stockAvailable = stockAvailable;
    }


    public String getComment() {
        return comment;
    }


    public void setComment(
            String comment
    ) {
        this.comment = comment;
    }
}