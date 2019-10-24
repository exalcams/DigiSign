export class Header {
    DOCID: number;
    DocName: string;
    DocType: string;
    FileType: string;
    UploadedType: string;
    CurrentApprover: string;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
    IsActive: boolean;
}
export class HeaderView {
    DOCID: number;
    DocName: string;
    DocType: string;
    FileType: string;
    UploadedType: string;
    CurrentApprover: string;
    Entity: string;
    Group: string;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
    IsActive: boolean;
}

export class SignedHeaderView {
    DOCID: number;
    DocName: string;
    DocType: string;
    FileType: string;
    UploadedType: string;
    NoOfApprover: number;
    LastApprover: string;
    LastApproverComment: string;
    LastApprovedOn: Date;
    CreatedOn: Date;

}

export class UserTemplateValue {
    ID: number;
    DOCID: number;
    TemplateID: number;
    Key: string;
    Value: string;
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

export class ApproverView {
    ID: number;
    UserName: string;
    IsSelected: boolean;
}
export class AssignedApprover {
    ID: number;
    DOCID: number;
    Approvers: string;
    Level: number;
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
