import { Component, OnInit } from '@angular/core';
import { MasterService } from 'app/services/master.service';
import { Templates, AuthenticationDetails, MenuApp } from 'app/models/master';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-templatess',
  templateUrl: './templatess.component.html',
  styleUrls: ['./templatess.component.scss']
})
export class TemplateComponent implements OnInit {
  MenuItems: string[];
  authenticationDetails: AuthenticationDetails;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllTemplates: Templates[] = [];
  SelectedTemplate: Templates;
  searchText = '';
  selectTemplateID = 0;
  TemplateFormGroup: FormGroup;

  constructor(
    private _masterService: MasterService,
    private _router: Router,
    public snackBar: MatSnackBar,
    private _formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.authenticationDetails = new AuthenticationDetails();
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.IsProgressBarVisibile = false;
    this.SelectedTemplate = new Templates();
    this.TemplateFormGroup = this._formBuilder.group({
      TemplateType: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Retrive authorizationData
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.MenuItems = this.authenticationDetails.menuItemNames.split(',');
      if (this.MenuItems.indexOf('Template') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger);
        this._router.navigate(['/auth/login']);
      }
      this.GetAllTemplates();
    } else {
      this._router.navigate(['/auth/login']);
    }
  }

  ResetControl(): void {
    this.SelectedTemplate = new Templates();
    this.selectTemplateID = 0;
    this.TemplateFormGroup.reset();
    Object.keys(this.TemplateFormGroup.controls).forEach(key => {
      this.TemplateFormGroup.get(key).markAsUntouched();
    });

  }

  AddTemplate(): void {
    this.ResetControl();
  }

  GetAllTemplates(): void {
    this.IsProgressBarVisibile = true;
    this._masterService.GetAllTemplates().subscribe(
      (data) => {
        if (data) {
          this.AllTemplates = data as Templates[];
          if (this.AllTemplates.length && this.AllTemplates.length > 0) {
            this.loadSelectedTemplate(this.AllTemplates[0]);
          }
          this.IsProgressBarVisibile = false;
        }
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  loadSelectedTemplate(template: Templates): void {
    this.SelectedTemplate = template;
    this.selectTemplateID = template.ID;
    this.TemplateFormGroup.get('TemplateType').patchValue(template.TemplateType);
  }

  SaveClicked(): void {
    if (this.TemplateFormGroup.valid) {
      if (this.SelectedTemplate.ID) {
        const Actiontype = 'Update';
        this.OpenConfirmationDialog(Actiontype);
      } else {
        const Actiontype = 'Create';
        this.OpenConfirmationDialog(Actiontype);
      }
    } else {
      this.ShowValidationErrors();
    }
  }

  DeleteClicked(): void {
    if (this.TemplateFormGroup.valid) {
      if (this.SelectedTemplate.ID) {
        const Actiontype = 'Delete';
        this.OpenConfirmationDialog(Actiontype);
      }
    } else {
      this.ShowValidationErrors();
    }
  }

  ShowValidationErrors(): void {
    Object.keys(this.TemplateFormGroup.controls).forEach(key => {
      this.TemplateFormGroup.get(key).markAsTouched();
      this.TemplateFormGroup.get(key).markAsDirty();
    });
  }

  OpenConfirmationDialog(Actiontype: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        Actiontype: Actiontype,
        Catagory: 'Template'
      },
      panelClass: 'confirmation-dialog'
    };
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          if (Actiontype === 'Create') {
            this.CreateTemplate();
          } else if (Actiontype === 'Update') {
            this.UpdateTemplate();
          } else if (Actiontype === 'Delete') {
            this.DeleteTemplate();
          }
        }
      });
  }

  CreateTemplate(): void {
    this.SelectedTemplate.TemplateType = this.TemplateFormGroup.get('TemplateType').value;
    this.SelectedTemplate.CreatedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.CreateTemplate(this.SelectedTemplate).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Template created successfully', SnackBarStatus.success);
        this.GetAllTemplates();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  UpdateTemplate(): void {
    this.SelectedTemplate.TemplateType = this.TemplateFormGroup.get('TemplateType').value;
    this.SelectedTemplate.LastUpdatedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.UpdateTemplate(this.SelectedTemplate).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Template updated successfully', SnackBarStatus.success);
        this.GetAllTemplates();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

  DeleteTemplate(): void {
    this.SelectedTemplate.TemplateType = this.TemplateFormGroup.get('TemplateType').value;
    this.SelectedTemplate.LastUpdatedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._masterService.DeleteTemplate(this.SelectedTemplate).subscribe(
      (data) => {
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar('Template deleted successfully', SnackBarStatus.success);
        this.GetAllTemplates();
      },
      (err) => {
        console.error(err);
        this.IsProgressBarVisibile = false;
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
      }
    );
  }

}
