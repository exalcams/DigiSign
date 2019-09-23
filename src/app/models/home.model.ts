export class Header {
    DOCID: number;
    DocName: string;
    DocType: string;
    FileType: string;
    CurrentApprover: string;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
    IsActive: boolean;
}
export class Approver {
    ID: number;
    UserName: string;
    Desg: string;
    Email: string;
    FullName: string;
    MobileNumber: string;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
    IsActive: boolean;
}
export class AssignedApprover {
    ID: number;
    DOCID: string;
    Approvers: string;
    Level: string;
    Comments: string;
    IsApproved: string;
    AssignedOn?: Date;
    ApprovedOn?: Date;
    IsActive: boolean;
}

export class HeaderAndApproverList {
    DOCID: number;
    DocName: string;
    DocType: string;
    FileType: string;
    CurrentApprover: string;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
    IsActive: boolean;
    AssignedApproversList: AssignedApprover[];
}
