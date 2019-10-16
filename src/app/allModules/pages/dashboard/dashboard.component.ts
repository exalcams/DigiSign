import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry, MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { AuthenticationDetails } from 'app/models/master';
import { fuseAnimations } from '@fuse/animations';
import { Guid } from 'guid-typescript';
import { HomeService } from 'app/services/home.service';
import { HeaderAndApproverList, AssignedApprover, Header, HeaderView, Approver, ApproverView } from 'app/models/home.model';
import { FormArray, AbstractControl, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';
import { Templates, TemplateParaMapping } from 'app/models/template.model';
import { TemplateService } from 'app/services/template.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class DashboardComponent implements OnInit {
  authenticationDetails: AuthenticationDetails;
  MenuItems: string[];
  CurrentUserName: string;
  CurrentUserID: Guid;
  CurrentUserRole = '';
  CurrentDate: Date;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllApprovers: ApproverView[] = [];
  AllHeaders: HeaderView[] = [];
  AssignedApproversList: AssignedApprover[];
  HeaderFormGroup: FormGroup;
  HeaderTemplateFormGroup: FormGroup;
  TemplateParameterFormArray: FormArray = this._formBuilder.array([]);
  HeaderApproverFormGroup: FormGroup;
  HeaderApproverColumns: string[] = ['Approvers', 'Level'];
  HeaderApproverFormArray: FormArray = this._formBuilder.array([]);
  HeaderApproverDataSource = new BehaviorSubject<AbstractControl[]>([]);
  SelectedHead: HeaderView;
  fileToUpload: File;
  FileData: any;
  IsUpdateActionType = false;
  ApprovalFormGroup: FormGroup;
  DocumentCreationChoice = '1';
  AllTemplates: Templates[] = [];
  AllTemplateParaMappings: TemplateParaMapping[] = [];
  // fileToUploadList: File[] = [];
  constructor(
    private _router: Router,
    matIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private _formBuilder: FormBuilder,
    private _homeService: HomeService,
    private _templateService: TemplateService,
    private dialog: MatDialog,
  ) {
    this.SelectedHead = new HeaderView();
    this.CurrentDate = new Date();
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.IsProgressBarVisibile = false;
  }

  ngOnInit(): void {
    // Retrive authorizationData
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.CurrentUserName = this.authenticationDetails.userName;
      this.CurrentUserID = this.authenticationDetails.userID;
      this.CurrentUserRole = this.authenticationDetails.userRole;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('DocumentCreation') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
    } else {
      this._router.navigate(['/auth/login']);
    }
    this.HeaderFormGroup = this._formBuilder.group({
      DocName: ['', Validators.required],
      DocType: ['', Validators.required],
      FileType: ['', Validators.required],
    });
    this.HeaderTemplateFormGroup = this._formBuilder.group({
      TemplateType: ['', Validators.required],
      TemplateParameters: this.TemplateParameterFormArray
    });
    this.HeaderApproverFormGroup = this._formBuilder.group({
      HeaderApprovers: this.HeaderApproverFormArray
    });
    this.ApprovalFormGroup = this._formBuilder.group({
      Comments: ['', Validators.required]
    });
    this.GetAllTemplates();
    this.GetAllApproverViews();
    this.GetAllHeadersByUserName();
  }

  ResetForm(): void {
    this.ResetHeaderFormGroup();
    this.ResetHeaderTemplateFormGroup();
    this.ResetApprovalFormGroup();
  }
  ResetHeaderFormGroup(): void {
    this.HeaderFormGroup.reset();
    Object.keys(this.HeaderFormGroup.controls).forEach(key => {
      this.HeaderFormGroup.get(key).markAsUntouched();
    });
  }
  ResetHeaderTemplateFormGroup(): void {
    this.HeaderTemplateFormGroup.reset();
    Object.keys(this.HeaderTemplateFormGroup.controls).forEach(key => {
      this.HeaderTemplateFormGroup.get(key).markAsUntouched();
    });
  }

  ResetApprovalFormGroup(): void {
    this.ApprovalFormGroup.reset();
    Object.keys(this.ApprovalFormGroup.controls).forEach(key => {
      this.ApprovalFormGroup.get(key).markAsUntouched();
    });
  }

  ResetControl(): void {
    this.ResetHeaderApprovers();
    this.ResetTemplateParameters();
    this.ResetForm();
    this.DocumentCreationChoice = '1';
    this.SelectedHead = new HeaderView();
    this.fileToUpload = null;
    this.FileData = null;
    this.IsUpdateActionType = false;
    this.EnableAllApprovers();
  }

  ResetControlForDocumentCreation(): void {
    if (this.DocumentCreationChoice === '1') {
      this.ResetHeaderTemplateFormGroup();
    } else {
      this.ResetHeaderFormGroup();
    }
    this.ResetHeaderApprovers();
    this.ResetTemplateParameters();
    this.ResetApprovalFormGroup();
    this.EnableAllApprovers();
  }

  ClearFormArray = (formArray: FormArray) => {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }
  ResetTemplateParameters(): void {
    this.ClearFormArray(this.TemplateParameterFormArray);
  }
  ResetHeaderApprovers(): void {
    this.ClearFormArray(this.HeaderApproverFormArray);
    this.HeaderApproverDataSource.next(this.HeaderApproverFormArray.controls);
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
  GetAllApproverViews(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetAllApproverViews().subscribe(
      (data) => {
        if (data) {
          this.AllApprovers = data as ApproverView[];
        }
        this.IsProgressBarVisibile = false;
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  GetAllHeaders(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetAllHeaders().subscribe(
      (data) => {
        if (data) {
          this.AllHeaders = data as HeaderView[];
          if (this.AllHeaders && this.AllHeaders.length) {
            this.loadSelectedHeader(this.AllHeaders[0]);
          }
        }
        this.IsProgressBarVisibile = false;
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  GetAllHeadersByUserName(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetAllHeadersByUserName(this.CurrentUserName).subscribe(
      (data) => {
        if (data) {
          this.AllHeaders = data as HeaderView[];
          if (this.AllHeaders && this.AllHeaders.length) {
            this.loadSelectedHeader(this.AllHeaders[0]);
          }
        }
        this.IsProgressBarVisibile = false;
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  loadSelectedHeader(head: HeaderView): void {
    if (head) {
      this.ResetControl();
      this.IsUpdateActionType = true;
      this.SelectedHead = head;
      this.AssignedApproversList = [];
      this.GetHeaderDocumentByDocID();
      this.GetAssignedApproversByDocID();
    }
  }

  GetApproverName(Approvers: string): string {
    if (this.AllApprovers && this.AllApprovers.length) {
      const appro = this.AllApprovers.filter(x => x.ID.toString() === Approvers)[0];
      if (appro && appro.UserName) {
        return appro.UserName;
      }
    }
    return Approvers;
  }

  FindApproverClass(app: Header, first: any, i: number): string {
    return 'currentApproverClass';
  }

  GetHeaderDocumentByDocID(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetHeaderDocumentByDocID(this.SelectedHead.DOCID).subscribe(
      data => {
        if (data) {
          const file = new Blob([data], { type: 'application/pdf' });
          // const file = new Blob([this.fileToUpload], { type: this.fileToUpload.type });
          const fileURL = URL.createObjectURL(file);
          this.FileData = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
        }
        this.IsProgressBarVisibile = false;
      },
      error => {
        console.error(error);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  GetAssignedApproversByDocID(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetAssignedApproversByDocID(this.SelectedHead.DOCID).subscribe(
      (data) => {
        if (data) {
          this.IsProgressBarVisibile = false;
          this.AssignedApproversList = data as AssignedApprover[];
          this.ClearFormArray(this.HeaderApproverFormArray);
          if (this.AssignedApproversList && this.AssignedApproversList.length) {
            this.AssignedApproversList.forEach(x => {
              this.InsertHeaderApproverFormGroup(x);
            });
          } else {
            this.ResetHeaderApprovers();
          }
        }
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  DocumentCreationChoiceChange(): void {
    this.ResetControlForDocumentCreation();
  }

  TemplateSelectionChanged(event): void {
    const TemplateValue = event.value;
    this.AllTemplateParaMappings = [];
    this.ClearFormArray(this.TemplateParameterFormArray);
    this._templateService.GetTemplateParaMappingsByTemplate(TemplateValue).subscribe(
      (data) => {
        if (data) {
          this.AllTemplateParaMappings = data as TemplateParaMapping[];
          console.log(this.AllTemplateParaMappings);
          this.AllTemplateParaMappings.forEach(x => {
            this.InsertTemplateParameters(x);
          });
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  InsertTemplateParameters(params: TemplateParaMapping): void {
    // const VariableName = params.Variable;
    const row = this._formBuilder.group({
      VariableName: [params.DefaultValue, Validators.required],
    });
    this.TemplateParameterFormArray.push(row);
  }

  InsertHeaderApproverFormGroup(approver: AssignedApprover): void {
    const row = this._formBuilder.group({
      Approvers: [approver.Approvers, Validators.required],
      Level: [approver.Level, Validators.required],
      // Comments: [approver.Comments, Validators.required],
    });
    this.HeaderApproverFormArray.push(row);
    this.HeaderApproverDataSource.next(this.HeaderApproverFormArray.controls);
  }

  AddHeaderApprover(): void {
    if (this.HeaderFormGroup.enabled) {
      this.AddHeaderApproverFormGroup();
    }
  }

  RemoveHeaderApprover(): void {
    if (this.HeaderFormGroup.enabled) {
      if (this.HeaderApproverFormArray.length > 0) {
        this.HeaderApproverFormArray.removeAt(this.HeaderApproverFormArray.length - 1);
        this.HeaderApproverDataSource.next(this.HeaderApproverFormArray.controls);
      } else {
        this.notificationSnackBarComponent.openSnackBar('no items to delete', SnackBarStatus.warning);
      }
    }
  }

  AddHeaderApproverFormGroup(): void {
    const PreviousIndex = this.HeaderApproverFormArray.controls.length;
    const row = this._formBuilder.group({
      Approvers: ['', Validators.required],
      Level: [PreviousIndex + 1, Validators.required],
      // Comments: ['', Validators.required],
    });
    this.HeaderApproverFormArray.push(row);
    this.HeaderApproverDataSource.next(this.HeaderApproverFormArray.controls);
  }

  ApproverSelected(value: string): void {
    // console.log(value);
    if (this.AllApprovers && this.AllApprovers.length) {
      this.AllApprovers.forEach(x => x.IsSelected = false);
      this.DisableSelctedApprovers();
    }
  }

  DisableSelctedApprovers(): void {
    const HeaderApproversArry = this.HeaderFormGroup.get('HeaderApprovers') as FormArray;
    HeaderApproversArry.controls.forEach((x, i) => {
      const value = x.get('Approvers').value;
      const SelectedApprover = this.AllApprovers.filter(y => y.UserName === value)[0];
      if (SelectedApprover) {
        SelectedApprover.IsSelected = true;
      }
    });
  }

  EnableAllApprovers(): void {
    if (this.AllApprovers && this.AllApprovers.length) {
      this.AllApprovers.forEach(x => x.IsSelected = false);
    }
  }

  AssignApproversClicked(): void {
    if (this.DocumentCreationChoice === '1') {
      if (this.HeaderFormGroup.valid) {
        if (this.HeaderApproverFormGroup.valid) {
          if (!this.fileToUpload) {
            this.notificationSnackBarComponent.openSnackBar('Please select a file', SnackBarStatus.danger);
          } else {
            const Actiontype = 'Create';
            const Catagory = 'Documents';
            this.OpenConfirmationDialog(Actiontype, Catagory);
          }
        } else {
          this.ShowValidationErrors(this.HeaderApproverFormGroup);
        }
      } else {
        this.ShowValidationErrors(this.HeaderFormGroup);
      }
    } else {
      if (this.HeaderTemplateFormGroup.valid) {
        if (this.HeaderApproverFormGroup.valid) {
          if (!this.fileToUpload) {
            this.notificationSnackBarComponent.openSnackBar('Please select a file', SnackBarStatus.danger);
          } else {
            const Actiontype = 'Create';
            const Catagory = 'Documents';
            this.OpenConfirmationDialog(Actiontype, Catagory);
          }
        } else {
          this.ShowValidationErrors(this.HeaderApproverFormGroup);
        }
      } else {
        this.ShowValidationErrors(this.HeaderTemplateFormGroup);
      }
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
            this.CreateDocumentHeader();
          }
          else if (Actiontype === 'Approve') {
            this.ApproveHeader();
          }
        }
      });
  }

  CreateDocumentHeader(): void {
    if (this.DocumentCreationChoice === '1') {
      this.GetHeaderValues();
      this.IsProgressBarVisibile = true;
      this._homeService.CreateHeader(this.SelectedHead, this.fileToUpload).subscribe(
        (data) => {
          if (data) {
            this.SelectedHead.DOCID = data as number;
            this.AssignApprovers();
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
    } else {

    }
  }

  AssignApprovers(): void {
    this.GetHeaderApproverValues();
    this.IsProgressBarVisibile = true;
    this._homeService.AssignApprovers(this.AssignedApproversList).subscribe(
      (data) => {
        this.notificationSnackBarComponent.openSnackBar('Approver details updated successfully', SnackBarStatus.success);
        this.IsProgressBarVisibile = false;
        this.ResetControl();
        this.GetAllHeadersByUserName();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  GetHeaderValues(): void {
    this.SelectedHead = new HeaderView();
    this.SelectedHead.DocName = this.HeaderFormGroup.get('DocName').value;
    this.SelectedHead.DocType = this.HeaderFormGroup.get('DocType').value;
    this.SelectedHead.FileType = this.HeaderFormGroup.get('FileType').value;
    this.SelectedHead.CreatedBy = this.CurrentUserID.toString();
  }

  GetHeaderApproverValues(): void {
    this.AssignedApproversList = [];
    const HeaderApproversArr = this.HeaderApproverFormGroup.get('HeaderApprovers') as FormArray;
    HeaderApproversArr.controls.forEach((x, i) => {
      const headApp: AssignedApprover = new AssignedApprover();
      headApp.DOCID = this.SelectedHead.DOCID;
      headApp.Approvers = x.get('Approvers').value;
      headApp.Level = x.get('Level').value;
      // headApp.Comments = x.get('Comments').value;
      this.AssignedApproversList.push(headApp);
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

  ApproveClicked(): void {
    if (this.ApprovalFormGroup.valid) {
      const Actiontype = 'Approve';
      const Catagory = 'Documents';
      this.OpenConfirmationDialog(Actiontype, Catagory);
    } else {
      this.ShowValidationErrors(this.ApprovalFormGroup);
    }
  }

  ApproveHeader(): void {
    const Comments = this.ApprovalFormGroup.get('Comments').value;
    this.IsProgressBarVisibile = true;
    this._homeService.ApproveDocument(this.SelectedHead.DOCID, this.CurrentUserName, Comments).subscribe(
      (data) => {
        if (data) {
          const res = data as string;
          this.notificationSnackBarComponent.openSnackBar(res, SnackBarStatus.success);
        }
        this.IsProgressBarVisibile = false;
        this.ResetControl();
        this.GetAllHeadersByUserName();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
    console.log(Comments);
  }

  AddDocumentClicked(): void {
    this.ResetControl();
  }

  handleFileInput(evt, index: number): void {
    if (evt.target.files && evt.target.files.length > 0) {
      this.fileToUpload = evt.target.files[0];
      // this.fileToUploadList.push(this.fileToUpload);
      this.HeaderFormGroup.get('FileType').patchValue(this.fileToUpload.type);
      const file = new Blob([this.fileToUpload], { type: this.fileToUpload.type });
      const fileURL = URL.createObjectURL(file);
      this.FileData = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
    }
  }
}
