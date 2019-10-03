import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { AuthenticationDetails } from 'app/models/master';
import { Guid } from 'guid-typescript';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconRegistry, MatSnackBar, MatDialog } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { HomeService } from 'app/services/home.service';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { Templates, Group } from 'app/models/template.model';
import { TemplateService } from 'app/services/template.service';
import { BehaviorSubject } from 'rxjs';

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
  TemplateCreationFormGroup: FormGroup;
  fileToUpload: File;
  FileData: any;
  ParameterFormGroup: FormGroup;
  ParameterItemColumns: string[] = ['Variable', 'DataType', 'DefaultValue', 'Description'];
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
    this.TemplateCreationFormGroup = this._formBuilder.group({
      TemplateType: ['', Validators.required],
      Description: ['', Validators.required],
      Entity: ['', Validators.required],
      Group: ['', Validators.required],
    });

    this.GetAllTemplates();
    this.GetAllGroups();
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
    if (this.ParameterFormGroup.enabled) {
      this.AddParameterItemFormGroup();
    }
  }

  RemoveParameterItem(): void {
    if (this.ParameterFormGroup.enabled) {
      if (this.ParameterItemFormArray.length > 0) {
        this.ParameterItemFormArray.removeAt(this.ParameterItemFormArray.length - 1);
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
      DefaultValue: ['', Validators.required],
      Description: ['', Validators.required],
    });
    this.ParameterItemFormArray.push(row);
    this.ParameterItemDataSource.next(this.ParameterItemFormArray.controls);
  }

  handleFileInput(evt, index: number): void {
    if (evt.target.files && evt.target.files.length > 0) {
      this.fileToUpload = evt.target.files[0];
      const file = new Blob([this.fileToUpload], { type: this.fileToUpload.type });
      const fileURL = URL.createObjectURL(file);
      this.FileData = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
    }
  }

}
