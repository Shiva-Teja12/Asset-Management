package com.enfec.one.assets.dto.secondarydevice;

import com.enfec.one.assets.enums.AssetStatus;

import java.util.UUID;

public class AvailableSecondaryAssetResponse {

    private UUID id;
    private String assetTag;
    private String name;
    private String category;
    private String brand;
    private String model;
    private String serialNumber;
    private AssetStatus status;

    public AvailableSecondaryAssetResponse() {
    }

    public AvailableSecondaryAssetResponse(
            UUID id,
            String assetTag,
            String name,
            String category,
            String brand,
            String model,
            String serialNumber,
            AssetStatus status
    ) {
        this.id = id;
        this.assetTag = assetTag;
        this.name = name;
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.serialNumber = serialNumber;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAssetTag() {
        return assetTag;
    }

    public void setAssetTag(String assetTag) {
        this.assetTag = assetTag;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }
}