import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { AuthenticationDetails } from 'app/models/master';
import { Guid } from 'guid-typescript';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconRegistry, MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { HomeService } from 'app/services/home.service';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { Templates, Group, CreatedTemplate, TemplateParaMapping } from 'app/models/template.model';
import { TemplateService } from 'app/services/template.service';
import { BehaviorSubject } from 'rxjs';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-template-creation',
  templateUrl: './template-creation.component.html',
  styleUrls: ['./template-creation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class TemplateCreationComponent implements OnInit {
  authenticationDetails: AuthenticationDetails;
  MenuItems: string[];
  CurrentUserName: string;
  CurrentUserID: Guid;
  CurrentUserRole = '';
  CurrentDate: Date;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllTemplates: Templates[] = [];
  AllGroups: Group[] = [];
  SelectedCreatedTemplate: CreatedTemplate;
  TemplateParaMappingList: TemplateParaMapping[];
  TemplateCreationFormGroup: FormGroup;
  fileToUpload: File;
  FileData: any;
  // TemplateCreationFormGroup: FormGroup;
  DataTypeList: string[] = [];
  ParameterItemColumns: string[] = ['Variable', 'DataType', 'DefaultValue', 'Description', 'Action'];
  ParameterItemFormArray: FormArray = this._formBuilder.array([]);
  ParameterItemDataSource = new BehaviorSubject<AbstractControl[]>([]);

  constructor(
    private _router: Router,
    matIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private _formBuilder: FormBuilder,
    private _templateService: TemplateService,
    private dialog: MatDialog,
  ) {
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.IsProgressBarVisibile = false;
    this.SelectedCreatedTemplate = new CreatedTemplate();
  }

  ngOnInit(): void {
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.CurrentUserName = this.authenticationDetails.userName;
      this.CurrentUserID = this.authenticationDetails.userID;
      this.CurrentUserRole = this.authenticationDetails.userRole;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('TemplateCreation') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
    } else {
      this._router.navigate(['/auth/login']);
    }
    this.DataTypeList = ['int', 'double', 'string'];
    this.TemplateCreationFormGroup = this._formBuilder.group({
      TemplateType: ['', Validators.required],
      Description: ['', Validators.required],
      Entity: [''],
      Group: [''],
      ParameterItems: this.ParameterItemFormArray
    });

    // this.TemplateCreationFormGroup = this._formBuilder.group({
    //   ParameterItems: this.ParameterItemFormArray
    // });

    this.GetAllTemplates();
    this.GetAllGroups();
  }

  ResetForm(): void {
    this.TemplateCreationFormGroup.reset();
    Object.keys(this.TemplateCreationFormGroup.controls).forEach(key => {
      this.TemplateCreationFormGroup.get(key).markAsUntouched();
    });
  }
  ResetControl(): void {
    this.ResetParameterItems();
    this.ResetForm();
    this.SelectedCreatedTemplate = new CreatedTemplate();
    this.TemplateParaMappingList = [];
    this.fileToUpload = null;
    this.FileData = null;
  }

  ClearFormArray = (formArray: FormArray) => {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }
  ResetParameterItems(): void {
    this.ClearFormArray(this.ParameterItemFormArray);
    this.ParameterItemDataSource.next(this.ParameterItemFormArray.controls);
  }


  GetAllTemplates(): void {
    this._templateService.GetAllTemplates().subscribe(
      (data) => {
        if (data) {
          this.AllTemplates = data as Templates[];
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  GetAllGroups(): void {
    this._templateService.GetAllGroups().subscribe(
      (data) => {
        if (data) {
          this.AllGroups = data as Group[];
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  AddParameterItem(): void {
    this.AddParameterItemFormGroup();
  }

  RemoveParameterItem(index: number): void {
    if (this.TemplateCreationFormGroup.enabled) {
      if (this.ParameterItemFormArray.length > 0) {
        this.ParameterItemFormArray.removeAt(index);
        this.ParameterItemDataSource.next(this.ParameterItemFormArray.controls);
      } else {
        this.notificationSnackBarComponent.openSnackBar('no items to delete', SnackBarStatus.warning);
      }
    }
  }

  AddParameterItemFormGroup(): void {
    const row = this._formBuilder.group({
      Variable: ['', Validators.required],
      DataType: ['', Validators.required],
      DefaultValue: [''],
      Description: [''],
    });
    this.ParameterItemFormArray.push(row);
    // this.ParameterItemFormArray.controls.unshift(row);
    this.ParameterItemDataSource.next(this.ParameterItemFormArray.controls);
  }

  handleFileInput(evt): void {
    if (evt.target.files && evt.target.files.length > 0) {
      this.fileToUpload = evt.target.files[0];
      const file = new Blob([this.fileToUpload], { type: this.fileToUpload.type });
      const fileURL = URL.createObjectURL(file);
      this.FileData = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
    }
  }

  SubmitClicked(): void {
    if (this.TemplateCreationFormGroup.valid) {
      if (!this.fileToUpload) {
        this.notificationSnackBarComponent.openSnackBar('Please select a file', SnackBarStatus.danger);
      }
      else {
        const ParameterItemsArry = this.TemplateCreationFormGroup.get('ParameterItems') as FormArray;
        if (ParameterItemsArry.length <= 0) {
          this.notificationSnackBarComponent.openSnackBar('Please add parameter mapping', SnackBarStatus.danger);
        } else {
          const Actiontype = 'Create';
          const Catagory = 'Template';
          this.OpenConfirmationDialog(Actiontype, Catagory);
        }
      }
    } else {
      this.ShowValidationErrors(this.TemplateCreationFormGroup);
    }
  }

  OpenConfirmationDialog(Actiontype: string, Catagory: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        Actiontype: Actiontype,
        Catagory: Catagory
      },
    };
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          if (Actiontype === 'Create') {
            this.CreateTemplate();
            // console.log('valid');
          }
          else if (Actiontype === 'Approve') {
            // this.ApproveHeader();
          }
        }
      });
  }
  ShowValidationErrors(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      if (!formGroup.get(key).valid) {
        console.log(key);
      }
      formGroup.get(key).markAsTouched();
      formGroup.get(key).markAsDirty();
      if (formGroup.get(key) instanceof FormArray) {
        const FormArrayControls = formGroup.get(key) as FormArray;
        Object.keys(FormArrayControls.controls).forEach(key1 => {
          if (FormArrayControls.get(key1) instanceof FormGroup) {
            const FormGroupControls = FormArrayControls.get(key1) as FormGroup;
            Object.keys(FormGroupControls.controls).forEach(key2 => {
              FormGroupControls.get(key2).markAsTouched();
              FormGroupControls.get(key2).markAsDirty();
              if (!FormGroupControls.get(key2).valid) {
                console.log(key2);
              }
            });
          } else {
            FormArrayControls.get(key1).markAsTouched();
            FormArrayControls.get(key1).markAsDirty();
          }
        });
      }
    });
  }

  CreateTemplate(): void {
    this.GetHeaderValues();
    this.IsProgressBarVisibile = true;
    this._templateService.CreateTemplate(this.SelectedCreatedTemplate, this.fileToUpload).subscribe(
      (data) => {
        if (data) {
          this.SelectedCreatedTemplate.TemplateID = data as number;
          this.CreateTemplateParaMapping();
        } else {
          this.notificationSnackBarComponent.openSnackBar('Something went wrong', SnackBarStatus.danger);
        }
        this.IsProgressBarVisibile = false;
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  CreateTemplateParaMapping(): void {
    this.GetParameterValues();
    this.IsProgressBarVisibile = true;
    this._templateService.CreateTemplateParaMapping(this.TemplateParaMappingList).subscribe(
      (data) => {
        this.notificationSnackBarComponent.openSnackBar('Template details updated successfully', SnackBarStatus.success);
        this.IsProgressBarVisibile = false;
        this.ResetControl();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  GetHeaderValues(): void {
    this.SelectedCreatedTemplate = new CreatedTemplate();
    this.SelectedCreatedTemplate.TemplateType = this.TemplateCreationFormGroup.get('TemplateType').value;
    this.SelectedCreatedTemplate.Description = this.TemplateCreationFormGroup.get('Description').value;
    this.SelectedCreatedTemplate.Entity = this.TemplateCreationFormGroup.get('Entity').value;
    this.SelectedCreatedTemplate.Group = this.TemplateCreationFormGroup.get('Group').value;
    this.SelectedCreatedTemplate.CreatedBy = this.CurrentUserID.toString();
  }

  GetParameterValues(): void {
    this.TemplateParaMappingList = [];
    const HeaderApproversArr = this.TemplateCreationFormGroup.get('ParameterItems') as FormArray;
    HeaderApproversArr.controls.forEach((x, i) => {
      const headApp: TemplateParaMapping = new TemplateParaMapping();
      headApp.TemplateID = this.SelectedCreatedTemplate.TemplateID;
      headApp.Variable = x.get('Variable').value;
      headApp.DataType = x.get('DataType').value;
      headApp.DefaultValue = x.get('DefaultValue').value;
      headApp.Description = x.get('Description').value;
      headApp.CreatedBy = this.CurrentUserID.toString();
      this.TemplateParaMappingList.push(headApp);
    });
  }


}
