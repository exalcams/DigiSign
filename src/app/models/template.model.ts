export class Templates {
    TemplateID: number;
    TemplateType: string;
    IsActive: boolean;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
}

export class Group {
    GroupID: number;
    GroupName: string;
    IsActive: boolean;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
}
