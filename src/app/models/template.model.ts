export class Templates {
    ID: number;
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
export class CreatedTemplate {
    TemplateID: number;
    TemplateType: string;
    Description: string;
    Entity: string;
    Group: string;
    IsActive: boolean;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
}

export class TemplateParaMapping {
    ParaID: number;
    TemplateID: number;
    Variable: string;
    DataType: string;
    DefaultValue: string;
    Description: string;
    Key: string;
    IsActive: boolean;
    CreatedBy: string;
    CreatedOn: Date;
    LastUpdatedBy: string;
    LastUpdatedOn?: Date;
}
