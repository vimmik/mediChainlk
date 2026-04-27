# ER Diagram – Pharmacy Management System

## Entities and Attributes

---

### UserType (Roles)
> Three types: Admin, Pharmacists, Customers

| Attribute | Notes |
|-----------|-------|
| **UserTypeID** *(PK)* | |
| UserTypeCode | |
| UserTypeName | |

---

### User

| Attribute | Notes |
|-----------|-------|
| **UserID** *(PK)* | |
| UserTypeID *(FK → UserType)* | |
| UserName | |
| Password | |
| Email | |
| TPNumber | |
| FirstName | |
| LastName | |
| BirthDay | |
| Gender | |
| Height | |
| Weight | |
| NIC | |
| AddressLine1 | |
| AddressLine2 | |
| AddressLine3 | |
| District | |
| PostalCode | |
| LocationCode | |
| PharmacyID *(FK → Pharmacy)* | Only applicable if UserType = Pharmacist |

---

### ScreenPermissions

| Attribute | Notes |
|-----------|-------|
| **PermissionID** *(PK)* | |
| PermissionCode | |
| ScreenName | |

---

### UserTypePermissionMapping

| Attribute | Notes |
|-----------|-------|
| **ID** *(PK)* | |
| UserTypeCode/ID *(FK → UserType)* | |
| PermissionCode/ID *(FK → ScreenPermissions)* | |

---

### Disease Details

| Attribute | Notes |
|-----------|-------|
| **DiseaseDetailID** *(PK)* | |
| DiseaseCode | |
| DiseaseName | |

---

### Disease User Mapping

| Attribute | Notes |
|-----------|-------|
| **ID** *(PK)* | |
| UserID *(FK → User)* | |
| DiseaseID *(FK → Disease Details)* | |
| DiseaseDetailID *(FK → Disease Details)* | |
| UserTypeID *(FK → UserType)* | |
> Note: *if customer*

---

### PrescriptionHeader

| Attribute | Notes |
|-----------|-------|
| **PrescriptionHeaderID** *(PK)* | |
| UserID *(FK → User)* | |
| SubmittedDate | |
| Image | |
| DoctorName | |
| PharmacistsUserID *(FK → User)* | |
| 🔒 *(status/flag field)* | |

---

### PrescriptionDetail

| Attribute | Notes |
|-----------|-------|
| **PrescriptionDetailID** *(PK)* | |
| PrescriptionHeaderID *(FK → PrescriptionHeader)* | |
| Medicine BinMappingID *(FK → MedicineBinMapping)* | |
| MeasuringUnitID | |
| Units/Count | |
| UnitPrice | |
| TotalPrice | |
| Image ItemDetailID | |

---

### BillHeader

| Attribute | Notes |
|-----------|-------|
| **BillID** *(PK)* | |
| PrescriptionHeaderID *(FK → PrescriptionHeader)* | |
| UserID *(FK → User)* | |
| BillDate | |
| BillNumber | |
| TotalPrice | |
| DiscountTypeID | |
| DiscountAmount | |
| NetPrice | |
| IsPaid | |

---

### PickMe (Delivery/Pickup)

| Attribute | Notes |
|-----------|-------|
| **ID** *(PK)* | |
| InvoiceCode | |
| DriverName | |
| DriverNIC | |
| Cost | |
| VehicleType | |
| VehicleNumber | |
| IsDelivered | |
| BillID *(FK → BillHeader)* | |

---

### MedicineCategory

| Attribute | Notes |
|-----------|-------|
| **MedicineCategoryID** *(PK)* | |
| MedicineCategoryCode | |

---

### Medicine

| Attribute | Notes |
|-----------|-------|
| **MedicineID** *(PK)* | |
| MedicineCode | |
| MeasuringUnitFD | |
| MedicineCategoryID *(FK → MedicineCategory)* | |
| MedicineName | |
| CompanyID *(FK → MedicineCompany)* | |

---

### MedicineCompany

| Attribute | Notes |
|-----------|-------|
| **MedicineCompanyID** *(PK)* | |
| MedicineCode | |
| CompanyCode | |
| CompanyName | |
| Email | |
| Tel/Number | |

---

### Bin

| Attribute | Notes |
|-----------|-------|
| **BinID** *(PK)* | |
| BinCode | |
| BinName | |
| ManufacID | |

---

### MedicineBinMapping

| Attribute | Notes |
|-----------|-------|
| **MedicineBinMappingID** *(PK)* | |
| BinID *(FK → Bin)* | |
| MedicineID *(FK → Medicine)* | |
| MedicineCategoryID *(FK → MedicineCategory)* | |
| CompanyID *(FK → MedicineCompany)* | |

---

### ItemDetail

| Attribute | Notes |
|-----------|-------|
| **ItemID** *(PK)* | |
| MedicineID *(FK → Medicine)* | |
| Medicine BinMappingID *(FK → MedicineBinMapping)* | |
| ReOrderLevel | |
| MinLevel | |
| MaxLevel | |
| RemainingUnitID | |
| AssessingUnitID | |
| BinID *(FK → Bin)* | |

---

### Transaction (Header)

| Attribute | Notes |
|-----------|-------|
| **TransactionTypeID** *(PK)* | |
| TransactionType | |
| TransactionTypeCode | |
| TransactionTypeRef | |
| TransactionDifference | |

---

### Transaction (Detail)

| Attribute | Notes |
|-----------|-------|
| **TransactionID** *(PK)* | |
| TransactionTypeID *(FK → Transaction Header)* | |
| TransactionNCPCode | |
| TransactionTypeRef | |
| TransactionDifference | |

---

### Z Transaction

> *(non-unique)*

| Attribute | Notes |
|-----------|-------|
| TransactionID | |
| TransactionTypeID | |
| ItemIssueID *(FK → ItemDetail)* | |
| GRN ID | |
| MeasuringUnit | |
| Quantity | |
| ItemDetailID *(FK → ItemDetail)* | |
| MeasuringUnitID | |
| Transaction # *(not known)* | |
| PrescriptionDetailID *(FK → PrescriptionDetail)* | |

---

### Pharmacy

| Attribute | Notes |
|-----------|-------|
| **PharmacyID** *(PK)* | |
| LocationCode | |
| OwnerName | |
| ContactNumber | |
| Email | |

---

### Item Requests

| Attribute | Notes |
|-----------|-------|
| **RequestID** *(PK)* | |
| MedicineID *(FK → Medicine)* | |
| PharmacyID *(FK → Pharmacy)* | |
| RequestDate | |
| IsSupplied | |
| Quantity | |
| IsApproved | |

---

### GRN Header

| Attribute | Notes |
|-----------|-------|
| **GRNHeaderID** *(PK)* | |
| RequestID *(FK → Item Requests)* | |
| PharmacyID *(FK → Pharmacy)* | |
| GRNDate | |
| IsApproved | |

---

### GRN Detail

| Attribute | Notes |
|-----------|-------|
| **GRNDetailID** *(PK)* | |
| GRNHeaderID *(FK → GRN Header)* | |
| PharmacyID *(FK → Pharmacy)* | |
| Medicine BinMappingID *(FK → MedicineBinMapping)* | |
| MedicineID *(FK → Medicine)* | |
| Item DetailID *(FK → ItemDetail)* | |
| MeasuringUnitID | |
| Quantity | |
| AvailableQuantity | |

---

### MeasuringUnitCategory

| Attribute | Notes |
|-----------|-------|
| **MeasuringUnitCategoryID** *(PK)* | |
| MeasuringUnitCategoryCode | |
| MeasuringUnitCategoryName | |

---

### MeasuringUnit

| Attribute | Notes |
|-----------|-------|
| **MeasuringUnitID** *(PK)* | |
| MeasuringUnitCompanyID *(FK → MedicineCompany)* | |
| MeasuringUnitCategoryID *(FK → MeasuringUnitCategory)* | |
| MeasuringUnitCode | |
| MeasuringUnitName | |

---

### MeasuringUnitConversion

| Attribute | Notes |
|-----------|-------|
| **MeasuringUnitConversionID** *(PK)* | |
| MeasuringUnitID1 *(FK → MeasuringUnit)* | |
| MeasuringUnitID2 *(FK → MeasuringUnit)* | |
| MeasuringUnit1 | |
| Quantity1 | |
| Quantity2 | |
| MedicineID *(FK → Medicine)* | |

---

## Relationships Summary

```
UserType ──< User
UserType ──< UserTypePermissionMapping >── ScreenPermissions
User ──< DiseaseUserMapping >── DiseaseDetails
User ──< PrescriptionHeader
User (Pharmacist) ──< PrescriptionHeader
PrescriptionHeader ──< PrescriptionDetail >── MedicineBinMapping
PrescriptionHeader ──< BillHeader
BillHeader ──< PickMe
MedicineCategory ──< Medicine
MedicineCompany ──< Medicine
Medicine ──< MedicineBinMapping >── Bin
MedicineBinMapping ──< ItemDetail
MedicineBinMapping ──< PrescriptionDetail
MedicineBinMapping ──< GRNDetail
ItemDetail ──< ZTransaction
Pharmacy ──< ItemRequests
ItemRequests ──< GRNHeader
GRNHeader ──< GRNDetail
TransactionHeader ──< TransactionDetail
TransactionDetail ──< ZTransaction
MeasuringUnitCategory ──< MeasuringUnit
MeasuringUnit ──< MeasuringUnitConversion (as UnitID1)
MeasuringUnit ──< MeasuringUnitConversion (as UnitID2)
MeasuringUnitConversion >── Medicine
Pharmacy ──< User (when UserType = Pharmacist)
```

---

*ER diagram transcribed from hand-drawn diagram – Pharmacy Management System*
