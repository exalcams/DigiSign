import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { AuthenticationDetails } from 'app/models/master';
import { fuseAnimations } from '@fuse/animations';
import { Guid } from 'guid-typescript';
import { HomeService } from 'app/services/home.service';
import { HeaderAndApproverList, AssignedApprover, Header } from 'app/models/home.model';
import { FormArray, AbstractControl, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

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
  AllHeaders: Header[] = [];
  AssignedApproversList: AssignedApprover[];
  HeaderFormGroup: FormGroup;
  HeaderApproverColumns: string[] = ['Approvers', 'Level', 'Comments'];
  HeaderApproverFormArray: FormArray = this._formBuilder.array([]);
  HeaderApproverDataSource = new BehaviorSubject<AbstractControl[]>([]);
  SelectedHead: Header;
  fileToUpload: File;
  FileData: any;
  // fileToUploadList: File[] = [];
  constructor(
    private _router: Router,
    matIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private _formBuilder: FormBuilder,
    private _homeService: HomeService
  ) {
    this.SelectedHead = new Header();
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
      if (this.MenuItems.indexOf('Dashboard') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
    } else {
      this._router.navigate(['/auth/login']);
    }
    this.HeaderFormGroup = this._formBuilder.group({
      HeaderApprovers: this.HeaderApproverFormArray
    });
    this.GetAllHeaders();
  }

  ResetForm(): void {
    this.HeaderFormGroup.reset();
    Object.keys(this.HeaderFormGroup.controls).forEach(key => {
      this.HeaderFormGroup.get(key).markAsUntouched();
    });
  }
  ResetControl(): void {
    this.ResetHeaderApprovers();
    this.ResetForm();
    this.SelectedHead = new Header();
  }

  ClearFormArray = (formArray: FormArray) => {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }
  ResetHeaderApprovers(): void {
    this.ClearFormArray(this.HeaderApproverFormArray);
    this.HeaderApproverDataSource.next(this.HeaderApproverFormArray.controls);
  }

  GetAllHeaders(): void {
    this.IsProgressBarVisibile = true;
    this._homeService.GetAllHeaders().subscribe(
      (data) => {
        if (data) {
          this.AllHeaders = data as Header[];
        }
        this.IsProgressBarVisibile = false;
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  loadSelectedHeader(head: Header): void {
    if (head) {
      this.SelectedHead = head;
      this.AssignedApproversList = [];
      this.GetAssignedApproversByDocID();
    }
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

  InsertHeaderApproverFormGroup(approver: AssignedApprover): void {
    const row = this._formBuilder.group({
      Approvers: [approver.Approvers, Validators.required],
      Level: [approver.Level, Validators.required],
      Comments: [approver.Comments, Validators.required],
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
    const row = this._formBuilder.group({
      Approvers: ['', Validators.required],
      Level: ['', Validators.required],
      Comments: ['', Validators.required],
    });
    this.HeaderApproverFormArray.push(row);
    this.HeaderApproverDataSource.next(this.HeaderApproverFormArray.controls);
  }

  GetHeaderApproverValues(): void {
    this.AssignedApproversList = [];
    const HeaderApproversArr = this.HeaderFormGroup.get('HeaderApprovers') as FormArray;
    HeaderApproversArr.controls.forEach((x, i) => {
      const headApp: AssignedApprover = new AssignedApprover();
      headApp.DOCID = this.SelectedHead.DOCID.toString();
      headApp.Approvers = x.get('Approvers').value;
      headApp.Level = x.get('Level').value;
      headApp.Comments = x.get('Comments').value;
      this.AssignedApproversList.push(headApp);
    });
  }

  ShowValidationErrors(): void {
    Object.keys(this.HeaderFormGroup.controls).forEach(key => {
      if (!this.HeaderFormGroup.get(key).valid) {
        console.log(key);
      }
      this.HeaderFormGroup.get(key).markAsTouched();
      this.HeaderFormGroup.get(key).markAsDirty();
      if (this.HeaderFormGroup.get(key) instanceof FormArray) {
        const FormArrayControls = this.HeaderFormGroup.get(key) as FormArray;
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

  AssignApproversClicked(): void {
    if (this.HeaderFormGroup.valid) {
      this.GetHeaderApproverValues();
      this.IsProgressBarVisibile = true;
      this._homeService.AssignApprovers(this.AssignedApproversList).subscribe(
        (data) => {
          this.notificationSnackBarComponent.openSnackBar('Approver details updated successfully', SnackBarStatus.success);
          this.IsProgressBarVisibile = false;
          this.GetAssignedApproversByDocID();
        },
        (err) => {
          console.error(err);
          this.IsProgressBarVisibile = false;
          this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
        }
      );
    } else {
      this.ShowValidationErrors();
    }
  }

  AddDocumentClicked(): void {
    this.ResetControl();
  }

  handleFileInput(evt, index: number): void {
    if (evt.target.files && evt.target.files.length > 0) {
      this.fileToUpload = evt.target.files[0];
      // this.fileToUploadList.push(this.fileToUpload);
      const file = new Blob([this.fileToUpload], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      this.FileData = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
    }
  }
}
