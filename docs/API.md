# Enfec-one API quick reference

## Auth
POST `/api/auth/login`
```json
{"email":"admin@enfec.local","password":"ChangeMe123!"}
```

POST `/api/auth/signup`
```json
{"name":"Ravi Kumar","email":"ravi@enfec.local","password":"Password123!","department":"Engineering"}
```

Use the returned token:
`Authorization: Bearer <token>`

## Create asset
POST `/api/v1/assets`
```json
{"assetTag":"LAP-001","name":"Lenovo ThinkPad","category":"Laptop","serialNumber":"SN-001"}
```

## Update asset
PUT `/api/v1/assets/{id}`
```json
{"assetTag":"LAP-001","name":"Lenovo ThinkPad T14","category":"Laptop","serialNumber":"SN-001"}
```

## Assign asset
POST `/api/v1/assets/{id}/assign`
```json
{"employeeId":"<EMPLOYEE_UUID>","reason":"Issued for project work"}
```

## Return asset
POST `/api/v1/assets/{id}/return`
```json
{"reason":"Employee returned the laptop"}
```

## In repair
PATCH `/api/v1/assets/{id}/status`
```json
{"status":"IN_REPAIR","reason":"Screen not working - TKT-001"}
```

## Retire
PATCH `/api/v1/assets/{id}/status`
```json
{"status":"RETIRED","reason":"End of service life"}
```

## Employee ticket
POST `/api/v1/tickets`
```json
{"type":"ISSUE","assetId":"<ASSET_UUID>","subject":"Laptop not working","description":"Laptop is not turning on."}
```
